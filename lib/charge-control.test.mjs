import test from 'node:test';
import assert from 'node:assert/strict';
import { chargeControlRates, chargeControlStep } from './charge-control.ts';

test('an empty long base fills toward I tau and reaches 1 - exp(-1) after one lifetime', () => {
  const charge = chargeControlStep(0, 12, 3, 3);
  assert.ok(Math.abs(charge - 36 * (1 - Math.exp(-1))) < 1e-12);
  const rates = chargeControlRates(36, 12, 3);
  assert.equal(rates.recombinationMicroA, 12);
  assert.equal(rates.netMicroA, 0);
});

test('shutting off injection leaves exponential recombination decay', () => {
  const charge = chargeControlStep(36, 0, 3, 3);
  assert.ok(Math.abs(charge - 36 / Math.E) < 1e-12);
  assert.equal(chargeControlRates(charge, 0, 3).netMicroA, -charge / 3);
});

test('exact updates compose and invalid states fail', () => {
  const one = chargeControlStep(4, 8, 2, 1);
  const two = chargeControlStep(one, 8, 2, 1);
  assert.ok(Math.abs(two - chargeControlStep(4, 8, 2, 2)) < 1e-12);
  assert.throws(() => chargeControlStep(-1, 8, 2, 1));
  assert.throws(() => chargeControlStep(1, 8, 0, 1));
  assert.throws(() => chargeControlRates(1, NaN, 2));
});
