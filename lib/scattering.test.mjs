import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceCarriers, makeCarriers, scatteringTrend } from './scattering.ts';
import { advanceCarrierMotion, carrierSites } from './carrier-motion.ts';
test('each electron/hole hop lands on a site and wraps correctly in both directions', () => {
  for (const direction of [-1, 1]) {
    let scene = { hole: 2, electron: 0, phase: 0 };
    for (let hop = 1; hop <= carrierSites * 3; hop++) {
      scene = advanceCarrierMotion(scene, 1, direction);
      assert.equal(scene.electron, hop % carrierSites);
      assert.equal(
        scene.hole,
        (((2 + hop * direction) % carrierSites) + carrierSites) % carrierSites,
      );
      assert.equal(scene.phase, 0);
    }
    const partial = advanceCarrierMotion({ hole: 2, electron: 0, phase: 0.75 }, 0.5, direction);
    assert.equal(partial.electron, 1);
    assert.equal(partial.phase, 0.25);
  }
});
test('scattering rejects invalid settings before generating nonfinite paths', () => {
  const options = { kind: 'phonon', temperature: 300, density: 1e16, field: 0, charge: 1 };
  for (const setting of [{ temperature: 0 }, { density: NaN }, { field: Infinity }, { charge: 0 }])
    assert.throws(() => advanceCarriers(makeCarriers(), 0.03, { ...options, ...setting }));
  assert.throws(() => advanceCarriers(makeCarriers(), -1, options));
});
test('phonon scattering rises with temperature; impurity scattering falls and rises with doping', () => {
  assert.ok(scatteringTrend('phonon', 600, 1e16) > scatteringTrend('phonon', 200, 1e16));
  assert.ok(scatteringTrend('impurity', 600, 1e16) < scatteringTrend('impurity', 200, 1e16));
  assert.ok(scatteringTrend('impurity', 300, 1e18) > scatteringTrend('impurity', 300, 1e14));
});
test('ion charge reverses Coulomb deflection and hotter carriers turn less', () => {
  const p = { x: 25, y: 25, vx: 1, vy: 0, trail: [], flash: 0 };
  const run = (charge, temperature) =>
    advanceCarriers([p], 0.03, {
      kind: 'impurity',
      temperature,
      density: 1e14,
      field: 0,
      charge,
    })[0];
  assert.ok(run(1, 300).vy > 0);
  assert.ok(run(-1, 300).vy < 0);
  assert.ok(Math.abs(run(1, 600).vy) < Math.abs(run(1, 200).vy));
});
test('both trajectory models preserve finite particles and bounded trails across controls', () => {
  for (const kind of ['phonon', 'impurity'])
    for (const temperature of [200, 600])
      for (const field of [-1, 0, 1]) {
        let carriers = makeCarriers();
        for (let i = 0; i < 600; i++)
          carriers = advanceCarriers(
            carriers,
            0.05,
            { kind, temperature, density: 1e18, field, charge: -1 },
            () => 0.37,
          );
        assert.equal(carriers.length, 18);
        for (const p of carriers) {
          assert.ok([p.x, p.y, p.vx, p.vy].every(Number.isFinite));
          assert.ok(p.x >= 8 && p.x <= 592 && p.y >= 8 && p.y <= 312);
          assert.ok(p.trail.length <= 46);
        }
      }
});
