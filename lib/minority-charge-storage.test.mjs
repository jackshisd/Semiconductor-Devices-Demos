import test from 'node:test';
import assert from 'node:assert/strict';
import { minorityChargeStorage } from './minority-charge-storage.ts';

const settings = { NA: 1e17, ND: 1e16, lifetime: 1e-6 };

test('forward, equilibrium, and reverse bias give positive, zero, and negative excess', () => {
  const forward = minorityChargeStorage({ ...settings, voltage: 0.3 });
  const equilibrium = minorityChargeStorage({ ...settings, voltage: 0 });
  const reverse = minorityChargeStorage({ ...settings, voltage: -0.2 });
  assert.ok(forward.electronEdgeExcess > 0 && forward.holeEdgeExcess > 0);
  assert.equal(equilibrium.electronEdgeExcess, 0);
  assert.equal(equilibrium.holeStoredChargePerArea, 0);
  assert.ok(reverse.electronEdgeExcess < 0 && reverse.holeEdgeExcess < 0);
  assert.ok(reverse.electronEquilibrium + reverse.electronEdgeExcess > 0);
  assert.ok(reverse.holeEquilibrium + reverse.holeEdgeExcess > 0);
});

test('each profile falls by e in one diffusion length and its integral gives stored charge', () => {
  const state = minorityChargeStorage({ ...settings, voltage: 0.3 });
  assert.ok(
    Math.abs(state.electronExcess(state.electronLength) / state.electronEdgeExcess - 1 / Math.E) <
      1e-12,
  );
  assert.ok(
    Math.abs(state.holeExcess(state.holeLength) / state.holeEdgeExcess - 1 / Math.E) < 1e-12,
  );
  assert.ok(
    Math.abs(
      state.holeStoredChargePerArea / state.electronStoredChargePerArea -
        (state.holeEdgeExcess * state.holeLength) /
          (state.electronEdgeExcess * state.electronLength),
    ) < 1e-12,
  );
});

test('invalid settings are rejected', () => {
  assert.throws(() => minorityChargeStorage({ ...settings, voltage: NaN }));
  assert.throws(() => minorityChargeStorage({ ...settings, NA: 0, voltage: 0 }));
  assert.throws(() => minorityChargeStorage({ ...settings, voltage: 0 }).electronExcess(-1));
});

test('actual minority concentrations rise at forward bias and fall at reverse bias without going negative', () => {
  const forward = minorityChargeStorage({ ...settings, voltage: 0.3 });
  const reverse = minorityChargeStorage({ ...settings, voltage: -0.2 });
  const equilibrium = minorityChargeStorage({ ...settings, voltage: 0 });
  assert.ok(forward.electronConcentration(0) > equilibrium.electronEquilibrium);
  assert.ok(forward.holeConcentration(0) > equilibrium.holeEquilibrium);
  assert.ok(reverse.electronConcentration(0) > 0);
  assert.ok(reverse.holeConcentration(0) > 0);
  assert.ok(reverse.electronConcentration(0) < equilibrium.electronEquilibrium);
  assert.ok(reverse.holeConcentration(0) < equilibrium.holeEquilibrium);
  assert.ok(
    Math.abs(
      forward.electronConcentration(25 * forward.electronLength) / forward.electronEquilibrium - 1,
    ) < 0.002,
  );
});
