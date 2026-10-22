import test from 'node:test';
import assert from 'node:assert/strict';
import { transportScales, flightAt, collisionIntervals, collisionTimes } from './lecture-three.ts';
import { q } from './physics.ts';
test('lecture thermal speeds and hole mean free path match the slide examples', () => {
  const n = transportScales(false, 300, 1000),
    p = transportScales(true, 300, 1000, 0.1);
  assert.ok(n.thermal > 2.2e7 && n.thermal < 2.4e7);
  assert.ok(p.thermal > 1.8e7 && p.thermal < 2e7);
  assert.ok(p.meanFreePathNm > 18 && p.meanFreePathNm < 20);
  assert.ok(Math.abs(p.lowField - ((q * 1000 * 100 * p.tau) / p.mass) * 100) < 1e-8);
  assert.ok(Math.abs(transportScales(false, 600, 0).thermal / n.thermal - Math.sqrt(2)) < 1e-12);
});
test('saturation illustration preserves the low-field law, sign and slide limits', () => {
  for (const holes of [false, true]) {
    assert.equal(transportScales(holes, 300, 0).capped, 0);
    assert.equal(transportScales(holes, 300, 100).capped, (holes ? 470 : 1400) * 100);
    const limit = holes ? 6e6 : 8e6;
    assert.equal(transportScales(holes, 300, 1e5).capped, limit);
    assert.equal(transportScales(holes, 300, -1e5).capped, -limit);
  }
});
test('longer scattering time increases mobility and path length proportionally', () => {
  const a = transportScales(true, 300, 1000, 0.05),
    b = transportScales(true, 300, 1000, 0.1);
  assert.equal(b.mobility / a.mobility, 2);
  assert.equal(b.meanFreePathNm / a.meanFreePathNm, 2);
  assert.equal(b.lowField / a.lowField, 2);
  for (const args of [
    [false, 0, 1],
    [false, 300, NaN],
    [false, 300, 1, -1],
  ])
    assert.throws(() => transportScales(...args));
});
test('sampled collision timing resets field-gained momentum at each collision', () => {
  assert.ok(collisionIntervals.every((x) => x > 0 && Number.isFinite(x)));
  for (let i = 0; i < collisionTimes.length - 1; i++) {
    const start = flightAt(collisionTimes[i]);
    assert.equal(start.index, i);
    assert.equal(start.elapsed, 0);
    const mid = flightAt(collisionTimes[i] + collisionIntervals[i] / 2);
    assert.equal(mid.index, i);
    assert.ok(Math.abs(mid.elapsed - collisionIntervals[i] / 2) < 1e-12);
  }
  assert.equal(flightAt(collisionTimes.at(-1)).elapsed, 0);
});
