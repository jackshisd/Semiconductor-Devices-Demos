import test from 'node:test';
import assert from 'node:assert/strict';
import { matthiessen, makeMatthiessenScene, advanceMatthiessen } from './matthiessen.ts';
test('inverse mobilities add; equal limits halve the mobility', () => {
  const m = matthiessen(300, 1e16);
  assert.equal(m.phonon, 1400);
  assert.equal(m.impurity, 1400);
  assert.equal(m.total, 700);
  for (const T of [200, 300, 600])
    for (const N of [1e14, 1e16, 1e18]) {
      const r = matthiessen(T, N);
      assert.ok(r.total < r.phonon && r.total < r.impurity);
      assert.ok(Math.abs(1 / r.total - 1 / r.phonon - 1 / r.impurity) < 1e-14);
      assert.ok(Math.abs(r.phononShare + r.impurityShare - 1) < 1e-12);
    }
});
test('disabling mechanisms recovers each limit and handles the no-scattering case', () => {
  assert.equal(matthiessen(300, 1e16, true, false).total, 1400);
  assert.equal(matthiessen(300, 1e16, false, true).total, 1400);
  const off = matthiessen(300, 1e16, false, false);
  assert.equal(off.total, null);
  assert.equal(off.tauPs, null);
  assert.equal(off.phononShare + off.impurityShare, 0);
});
test('temperature and doping move the dominant scattering mechanism as in the slides', () => {
  assert.ok(matthiessen(200, 1e16).impurityShare > 0.5);
  assert.ok(matthiessen(600, 1e16).phononShare > 0.5);
  assert.ok(matthiessen(300, 1e18).total < matthiessen(300, 1e14).total);
  for (const args of [
    [0, 1e16],
    [300, -1],
    [Infinity, 1e16],
    [300, NaN],
  ])
    assert.throws(() => matthiessen(...args));
});
test('three-lane animation is reproducible and bounded, with no collisions when both mechanisms are off', () => {
  const m = matthiessen(300, 1e16, false, false),
    start = makeMatthiessenScene();
  assert.deepEqual(
    advanceMatthiessen(start, 0.03, m, 300),
    advanceMatthiessen(start, 0.03, m, 300),
  );
  let scene = start;
  for (let i = 0; i < 600; i++) scene = advanceMatthiessen(scene, 0.03, m, 300);
  assert.equal(scene.lanes.length, 3);
  for (const lane of scene.lanes)
    for (const p of lane) {
      assert.ok([p.x, p.y, p.vx, p.vy].every(Number.isFinite));
      assert.ok(p.x >= 8 && p.x < 552 && p.y >= 7 && p.y < 63);
      assert.ok(p.trail.length <= 41);
    }
  assert.ok(scene.lanes[2].every((p) => p.flash === 0));
});
