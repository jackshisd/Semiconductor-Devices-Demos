import test from 'node:test';
import assert from 'node:assert/strict';
import { maximumPowerPoint, solarCellState } from './solar-cell-ocv.ts';

const at = (illuminationSuns, voltage, saturationCurrentAcm2 = 4e-12) =>
  solarCellState({ illuminationSuns, voltage, saturationCurrentAcm2 });

test('open-circuit voltage is the zero-current crossing', () => {
  const state = at(1, 0);
  assert.equal(state.terminalCurrentMa, -50);
  assert.ok(state.openCircuitVoltage > 0.55 && state.openCircuitVoltage < 0.65);
  const open = at(1, state.openCircuitVoltage);
  assert.ok(Math.abs(open.terminalCurrentMa) < 1e-10);
  assert.ok(Math.abs(open.diodeCurrentMa - open.lightCurrentMa) < 1e-10);
  assert.ok(Math.abs(open.outputPowerMw) < 1e-10);
});

test('more light raises Voc logarithmically and maximum power lies between zero and Voc', () => {
  const dim = at(0.5, 0);
  const bright = at(2, 0);
  assert.ok(bright.openCircuitVoltage > dim.openCircuitVoltage);
  const mpp = maximumPowerPoint(1, 4e-12);
  assert.ok(mpp.voltage > 0 && mpp.voltage < at(1, 0).openCircuitVoltage);
  assert.ok(mpp.currentMa > 0 && mpp.currentMa < 50);
  assert.ok(mpp.powerMw > 0);
  assert.ok(mpp.fillFactor > 0 && mpp.fillFactor < 1);
  assert.ok(mpp.powerMw >= at(1, mpp.voltage - 0.01).outputPowerMw);
  assert.ok(mpp.powerMw >= at(1, mpp.voltage + 0.01).outputPowerMw);
});

test('dark cell has no solar open-circuit voltage or delivered power', () => {
  assert.equal(at(0, 0).openCircuitVoltage, 0);
  assert.deepEqual(maximumPowerPoint(0, 4e-12), {
    voltage: 0,
    currentMa: 0,
    powerMw: 0,
    fillFactor: 0,
  });
  assert.throws(() => at(-1, 0));
});
