import test from 'node:test';
import assert from 'node:assert/strict';
import { smallSignalDiode } from './small-signal-diode.ts';

const settings = { dcVoltage: 0.42, acAmplitude: 0.005, frequency: 1e6, capacitance: 30e-12 };

test('conductance is the local slope of the ideal diode I-V curve', () => {
  const state = smallSignalDiode(settings);
  const delta = 1e-6;
  const slope =
    (state.diodeCurrent(settings.dcVoltage + delta) -
      state.diodeCurrent(settings.dcVoltage - delta)) /
    (2 * delta);
  assert.ok(Math.abs(slope / state.conductance - 1) < 1e-8);
  assert.equal(state.tangentCurrent(settings.dcVoltage), state.dcCurrent);
  assert.ok(Math.abs(state.conductance * state.resistance - 1) < 1e-12);
});

test('R current follows voltage while C current peaks as voltage crosses zero', () => {
  const state = smallSignalDiode(settings);
  assert.ok(Math.abs(state.atPhase(0).resistiveCurrent) < 1e-18);
  assert.equal(state.atPhase(0).capacitiveCurrent, state.capacitiveAmplitude);
  assert.ok(Math.abs(state.atPhase(Math.PI / 2).capacitiveCurrent) < 1e-18);
  assert.equal(state.atPhase(Math.PI / 2).resistiveCurrent, state.resistiveAmplitude);
  assert.ok(
    Math.abs(
      state.totalAmplitude - Math.hypot(state.resistiveAmplitude, state.capacitiveAmplitude),
    ) < 1e-18,
  );
});

test('zero capacitance removes phase lead and a sufficiently small voltage is linear', () => {
  const state = smallSignalDiode({ ...settings, capacitance: 0, acAmplitude: 1e-5 });
  assert.equal(state.capacitiveAmplitude, 0);
  assert.equal(state.phaseLead, 0);
  const now = state.atPhase(Math.PI / 2);
  assert.ok(Math.abs(now.exactDiodeIncrement / now.resistiveCurrent - 1) < 0.001);
  assert.throws(() => smallSignalDiode({ ...settings, frequency: 0 }));
});
