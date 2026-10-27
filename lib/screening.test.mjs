import test from 'node:test';
import assert from 'node:assert/strict';
import { debyeLengthNm, screeningRatios } from './screening.ts';

test('Debye length has the silicon room-temperature scale and correct density trend', () => {
  const base = debyeLengthNm(1e16, 300);
  assert.ok(base > 40 && base < 42);
  assert.ok(Math.abs(debyeLengthNm(1e18, 300) / base - 0.1) < 1e-12);
  assert.ok(Math.abs(debyeLengthNm(1e16, 1200) / base - 2) < 1e-12);
});

test('screened potential and field weaken with distance', () => {
  const atOneLength = screeningRatios(40, 40);
  assert.ok(Math.abs(atOneLength.potential - Math.exp(-1)) < 1e-12);
  assert.ok(Math.abs(atOneLength.field - 2 / Math.E) < 1e-12);
  assert.ok(screeningRatios(80, 40).field < atOneLength.field);
  assert.throws(() => debyeLengthNm(0, 300));
  assert.throws(() => screeningRatios(0, 40));
});
