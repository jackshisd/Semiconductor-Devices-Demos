import test from 'node:test';
import assert from 'node:assert/strict';
import { mosSurfaceWidth } from './mos-surface-width.ts';

const params = { acceptors: 1e16, oxideNm: 10, flatBand: 0.2 };

test('depletion potential and width rise from flat band and reach threshold together', () => {
  const accumulation = mosSurfaceWidth(-0.5, params);
  const flat = mosSurfaceWidth(params.flatBand, params);
  const middle = mosSurfaceWidth(0.6, params);
  const threshold = mosSurfaceWidth(middle.thresholdVoltage, params);
  const inversion = mosSurfaceWidth(2, params);
  assert.equal(accumulation.surfacePotential, 0);
  assert.equal(flat.depletionWidth, 0);
  assert.ok(middle.surfacePotential > 0 && middle.surfacePotential < middle.thresholdPotential);
  assert.ok(middle.depletionWidth > 0 && middle.depletionWidth < middle.thresholdWidth);
  assert.ok(Math.abs(threshold.surfacePotential - threshold.thresholdPotential) < 1e-12);
  assert.ok(Math.abs(threshold.depletionWidth - threshold.thresholdWidth) < 1e-12);
  assert.equal(inversion.depletionWidth, threshold.depletionWidth);
});

test('depletion state satisfies gate voltage partition', () => {
  const gateVoltage = 0.6;
  const state = mosSurfaceWidth(gateVoltage, params);
  const q = 1.602176634e-19;
  const oxideDrop = (q * params.acceptors * state.depletionWidth) / state.oxideCapacitance;
  assert.ok(Math.abs(gateVoltage - params.flatBand - state.surfacePotential - oxideDrop) < 1e-12);
});

test('stronger doping lowers width and thicker oxide raises threshold voltage', () => {
  const baseline = mosSurfaceWidth(0, params);
  const moreDoped = mosSurfaceWidth(0, { ...params, acceptors: 1e17 });
  const thicker = mosSurfaceWidth(0, { ...params, oxideNm: 20 });
  assert.ok(moreDoped.thresholdWidth < baseline.thresholdWidth);
  assert.ok(thicker.thresholdVoltage > baseline.thresholdVoltage);
});
