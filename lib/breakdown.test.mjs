import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  avalancheModel,
  zenerModel,
  wkbEnvelope,
  emptyAvalanche,
  injectElectron,
  advanceAvalanche,
  MAX_ANIMATED_CARRIERS,
  IONIZATION_A,
  IONIZATION_B,
} from './breakdown.ts';

const near = (actual, expected, tolerance = 1e-10) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `${actual} != ${expected}`,
  );

test('avalanche field units, zero-field behavior, and single-pass multiplication', () => {
  const zero = avalancheModel(0, 1);
  assert.equal(zero.alpha, 0);
  assert.equal(zero.gain, 1);
  assert.equal(zero.ionizationProbability, 0);
  const a = avalancheModel(30, 1),
    b = avalancheModel(45, 1);
  near(a.field, 3e5);
  near(a.alpha, IONIZATION_A * Math.exp(-IONIZATION_B / 3e5));
  near(a.gain, Math.exp(a.alpha * 1e-4));
  assert.ok(b.alpha > a.alpha && b.gain > a.gain);
  const longerAtSameField = avalancheModel(60, 2);
  near(longerAtSameField.alpha, a.alpha);
  near(longerAtSameField.gain, a.gain ** 2);
});

test('impact animation creates neutral pairs and preserves carrier accounting through collection', () => {
  const seed = injectElectron(emptyAvalanche());
  const model = avalancheModel(45, 1.5);
  let scene = advanceAvalanche(seed, model, 0.1, false, () => 0);
  assert.equal(seed.particles.length, 1); // original state is immutable
  assert.equal(scene.pairs, 1);
  assert.equal(scene.particles.filter((p) => p.kind === 'electron').length, 2);
  assert.equal(scene.particles.filter((p) => p.kind === 'hole').length, 1);
  for (let step = 0; step < 200; step++) {
    scene = advanceAvalanche(scene, model, 0.05, false, () => 1);
    assert.equal(
      scene.seeded + 2 * scene.pairs,
      scene.particles.length + scene.collectedElectrons + scene.collectedHoles,
    );
    assert.equal(
      scene.seeded,
      scene.particles.filter((p) => p.kind === 'electron').length +
        scene.collectedElectrons -
        scene.particles.filter((p) => p.kind === 'hole').length -
        scene.collectedHoles,
    );
  }
  assert.equal(scene.particles.length, 0);
  assert.equal(scene.collectedElectrons, 2);
  assert.equal(scene.collectedHoles, 1);
});

test('zero field produces no drift or impacts, and capped cascades remain bounded', () => {
  const seed = injectElectron(emptyAvalanche());
  const zero = advanceAvalanche(seed, avalancheModel(0, 1), 1, false, () => 0);
  assert.equal(zero.particles[0].x, 0);
  assert.equal(zero.pairs, 0);
  let crowded = emptyAvalanche();
  for (let i = 0; i < MAX_ANIMATED_CARRIERS; i++) crowded = injectElectron(crowded);
  crowded = advanceAvalanche(crowded, avalancheModel(60, 0.5), 0.01, false, () => 0);
  assert.equal(crowded.particles.length, MAX_ANIMATED_CARRIERS);
  assert.equal(crowded.pairs, 0);
  assert.ok(crowded.limited);
  assert.equal(injectElectron(crowded).particles.length, MAX_ANIMATED_CARRIERS);
});

test('triangular-barrier WKB uses SI conversions and the correct turning point', () => {
  const state = zenerModel(6, 8);
  near(state.field, 7.5e6);
  near(state.tunnelDistanceNm, (1.12 * 8) / 6);
  assert.ok(state.transmission > 0.04 && state.transmission < 0.06);
  near(state.transmission + state.reflection, 1);
  near(wkbEnvelope(state, 0), 1);
  near(wkbEnvelope(state, state.tunnelDistanceNm), Math.sqrt(state.transmission));
  assert.ok(wkbEnvelope(state, state.tunnelDistanceNm / 2) > Math.sqrt(state.transmission));
  assert.ok(wkbEnvelope(state, state.tunnelDistanceNm / 2) < 1);
});

test('transmission increases with field and requires an accessible final state', () => {
  const low = zenerModel(3, 12),
    high = zenerModel(6, 12),
    thin = zenerModel(6, 6);
  assert.ok(high.transmission > low.transmission && thin.transmission > high.transmission);
  assert.ok(high.tunnelDistanceNm < low.tunnelDistanceNm);
  assert.ok(zenerModel(6, 12, 1.12, 0.2).transmission < high.transmission);
  const closed = zenerModel(0.5, 8),
    zero = zenerModel(0, 8);
  assert.equal(closed.channelOpen, false);
  assert.equal(closed.transmission, 0);
  assert.equal(zero.transmission, 0);
  assert.equal(zero.reflection, 1);
  near(wkbEnvelope(zero, 0), 1);
  assert.ok(Number.isFinite(wkbEnvelope(zero, 2)) && wkbEnvelope(zero, 2) < 1);
});

test('breakdown models reject nonphysical inputs', () => {
  assert.throws(() => avalancheModel(-1, 1));
  assert.throws(() => avalancheModel(1, 0));
  assert.throws(() => zenerModel(NaN, 8));
  assert.throws(() => zenerModel(5, -8));
  assert.throws(() => zenerModel(5, 8, 0));
  assert.throws(() => zenerModel(5, 8, 1.12, 0));
  assert.throws(() => advanceAvalanche(emptyAvalanche(), avalancheModel(30, 1), -1));
});

test('ionization includes the last in-device segment before a carrier is collected', () => {
  const model = avalancheModel(60, 0.5);
  const seed = injectElectron(emptyAvalanche(), 0.95);
  const scene = advanceAvalanche(seed, model, 0.2, false, () => 0);
  assert.equal(scene.collectedElectrons, 1);
  assert.equal(scene.pairs, 1);
  assert.ok(scene.particles.every((p) => p.x > 0.95 && p.x < 1));
  assert.equal(
    scene.seeded + 2 * scene.pairs,
    scene.particles.length + scene.collectedElectrons + scene.collectedHoles,
  );
});

test('automatic injection preserves the fractional source interval', () => {
  const seed = { ...emptyAvalanche(), sourceClock: 1.4 };
  const scene = advanceAvalanche(seed, avalancheModel(30, 1), 0.2, true, () => 0.5);
  assert.equal(scene.seeded, 1);
  near(scene.sourceClock, 0.1);
});
