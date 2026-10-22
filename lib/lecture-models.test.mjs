import test from 'node:test';
import assert from 'node:assert/strict';
import {
  atomicBands,
  equilibriumDoping,
  boltzmannComparison,
  makeSand,
  advanceSand,
  disturbSand,
  sandHighFraction,
} from './lecture-models.ts';
import { thermalVoltage } from './physics.ts';

const near = (a, b, tolerance = 1e-10) =>
  assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b)), `${a} != ${b}`);
test('silicon bands contain 4N states each and the histogram preserves their count', () => {
  for (const N of [1, 2, 4, 8, 16, 32, 64, 96]) {
    const band = atomicBands(N);
    assert.equal(band.valence.length, 2 * N);
    assert.equal(band.conduction.length, 2 * N);
    assert.equal(band.valenceStates, 4 * N);
    assert.equal(band.conductionStates, 4 * N);
    near(
      band.valenceDOS.reduce((sum, bin) => sum + bin.density * 0.03, 0),
      4 * N,
    );
    near(
      band.conductionDOS.reduce((sum, bin) => sum + bin.density * 0.03, 0),
      4 * N,
    );
    assert.ok(band.valence.every((E) => E < 0) && band.conduction.every((E) => E > 1.12));
  }
});
test('donors and acceptors satisfy charge neutrality, mass action, and opposite majority trends', () => {
  for (const type of ['n', 'p'])
    for (const T of [200, 300, 450]) {
      let previous = 0;
      for (const N of [1e12, 1e14, 1e16, 1e17]) {
        const state = equilibriumDoping(type, N, T);
        near((type === 'n' ? state.n - state.p : state.p - state.n) / N, 1);
        near((state.n * state.p) / state.intrinsic ** 2, 1);
        assert.ok(state.majority > previous && state.majority > state.minority);
        previous = state.majority;
      }
    }
});
test('Boltzmann tails have about 5% relative error at 3kT and mirror for holes', () => {
  for (const T of [200, 300, 600]) {
    const at = boltzmannComparison(3 * thermalVoltage(T), T);
    assert.ok(at.relativeError > 0.049 && at.relativeError < 0.05);
    near(at.exact, 0.04742587317756678);
    const hole = boltzmannComparison(-3 * thermalVoltage(T), T, true);
    near(hole.exact, at.exact);
    near(hole.approximate, at.approximate);
  }
  const edge = boltzmannComparison(0, 300);
  near(edge.exact, 0.5);
  near(edge.approximate, 1);
  assert.equal(edge.valid, false);
  assert.ok(boltzmannComparison(-0.1, 300).approximate > 1);
});
test('sand animation is deterministic, conserves grains, and accounts for threshold traffic', () => {
  const original = makeSand();
  const snapshot = JSON.stringify(original);
  assert.deepEqual(advanceSand(original, 300, 0.05), advanceSand(original, 300, 0.05));
  assert.equal(JSON.stringify(original), snapshot);
  let state = disturbSand(original);
  const initialHigh = state.grains.filter((g) => g.y >= 0.18).length;
  for (let step = 0; step < 300; step++) state = advanceSand(state, 300, 0.05);
  assert.equal(state.grains.length, 100);
  assert.ok(
    state.grains.every(
      (g) => g.x >= 0.02 && g.x <= 0.98 && g.y >= 0 && g.y <= 1 && Number.isFinite(g.vy),
    ),
  );
  assert.equal(state.up - state.down, state.grains.filter((g) => g.y >= 0.18).length - initialHigh);
});
test('agitated sand returns toward equilibrium and higher vibration increases high-energy occupancy', () => {
  const averages = [];
  for (const T of [150, 600]) {
    let state = disturbSand(makeSand(T));
    let total = 0,
      samples = 0;
    for (let step = 0; step < 700; step++) {
      state = advanceSand(state, T, 0.05);
      if (step > 300) {
        total += state.grains.filter((g) => g.y >= 0.18).length / 100;
        samples++;
      }
    }
    const average = total / samples;
    averages.push(average);
    assert.ok(
      Math.abs(average - sandHighFraction(T)) < 0.035,
      `T=${T}: ${average} vs ${sandHighFraction(T)}`,
    );
  }
  assert.ok(averages[1] > averages[0] + 0.08);
  const cold = advanceSand(makeSand(0), 0, 0.1);
  assert.ok(cold.grains.every((g) => g.y === 0 && g.vy === 0));
});
test('teaching models reject nonphysical inputs', () => {
  assert.throws(() => atomicBands(1.5));
  assert.throws(() => atomicBands(0));
  assert.throws(() => atomicBands(97));
  assert.throws(() => equilibriumDoping('n', -1));
  assert.throws(() => boltzmannComparison(0, 0));
  assert.throws(() => advanceSand(makeSand(), 300, Infinity));
});
