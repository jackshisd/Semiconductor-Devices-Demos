import test from 'node:test';
import assert from 'node:assert/strict';
import { varactorProfiles, varactorState } from './varactor.ts';

const at = (profile, reverseVoltage) =>
  varactorState({
    profile,
    reverseVoltage,
    zeroBiasCapacitancePf: 100,
    builtInVoltage: 0.7,
    inductanceMicroH: 10,
  });

test('reverse bias widens depletion, reduces capacitance, and raises frequency', () => {
  for (const profile of Object.keys(varactorProfiles)) {
    const zero = at(profile, 0);
    const biased = at(profile, 5);
    assert.equal(zero.capacitancePf, 100);
    assert.equal(zero.widthRatio, 1);
    assert.ok(biased.widthRatio > 1);
    assert.ok(biased.capacitancePf < zero.capacitancePf);
    assert.ok(biased.frequencyMHz > zero.frequencyMHz);
    assert.ok(Math.abs(biased.capacitancePf * biased.widthRatio - 100) < 1e-10);
  }
});

test('profile grading determines how sharply capacitance tunes', () => {
  const graded = at('graded', 5);
  const abrupt = at('abrupt', 5);
  const hyperabrupt = at('hyperabrupt', 5);
  assert.ok(graded.capacitancePf > abrupt.capacitancePf);
  assert.ok(abrupt.capacitancePf > hyperabrupt.capacitancePf);
  assert.equal(graded.exponent, 1 / 3);
  assert.equal(abrupt.exponent, 1 / 2);
  assert.equal(hyperabrupt.exponent, 2);
});

test('frequency follows the LC resonance law', () => {
  const state = at('abrupt', 2);
  const expected = 1 / (2 * Math.PI * Math.sqrt(10e-6 * state.capacitancePf * 1e-12)) / 1e6;
  assert.ok(Math.abs(state.frequencyMHz / expected - 1) < 1e-12);
  assert.throws(() => at('abrupt', -1));
});
