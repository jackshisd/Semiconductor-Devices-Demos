import test from 'node:test';
import assert from 'node:assert/strict';
import { diodeCapacitances } from './diode-capacitances.ts';

const base = { donorDensity: 1e16, area: 1e-4, lifetime: 1e-6 };

test('reverse bias widens depletion and lowers junction capacitance', () => {
  const reverse = diodeCapacitances({ ...base, voltage: -1 });
  const zero = diodeCapacitances({ ...base, voltage: 0 });
  assert.ok(reverse.depletionWidth > zero.depletionWidth);
  assert.ok(reverse.junctionCapacitance < zero.junctionCapacitance);
  assert.ok(reverse.diffusionCapacitance < zero.diffusionCapacitance);
});

test('forward bias grows diffusion capacitance exponentially and both parts add', () => {
  const low = diodeCapacitances({ ...base, voltage: 0.2 });
  const high = diodeCapacitances({ ...base, voltage: 0.55 });
  assert.ok(high.diffusionCapacitance > low.diffusionCapacitance * 1e4);
  assert.ok(high.junctionCapacitance > low.junctionCapacitance);
  assert.equal(high.totalCapacitance, high.diffusionCapacitance + high.junctionCapacitance);
  assert.ok(high.diffusionCapacitance > high.junctionCapacitance);
});

test('capacitances match numerical derivatives of their respective charges', () => {
  const voltage = 0.4;
  const delta = 1e-5;
  const state = diodeCapacitances({ ...base, voltage });
  const upper = diodeCapacitances({ ...base, voltage: voltage + delta });
  const lower = diodeCapacitances({ ...base, voltage: voltage - delta });
  const diffusionSlope = (upper.storedExcessCharge - lower.storedExcessCharge) / (2 * delta);
  const depletionSlope = Math.abs(
    (upper.depletionChargeMagnitude - lower.depletionChargeMagnitude) / (2 * delta),
  );
  assert.ok(Math.abs(diffusionSlope / state.diffusionCapacitance - 1) < 1e-6);
  assert.ok(Math.abs(depletionSlope / state.junctionCapacitance - 1) < 1e-6);
  assert.ok(Math.abs(state.diffusionCapacitance / (base.lifetime * state.conductance) - 1) < 1e-12);
});

test('nonphysical inputs are rejected', () => {
  assert.throws(() => diodeCapacitances({ ...base, voltage: NaN }));
  assert.throws(() => diodeCapacitances({ ...base, voltage: 0, area: 0 }));
  assert.throws(() => diodeCapacitances({ ...base, voltage: 10 }));
});
