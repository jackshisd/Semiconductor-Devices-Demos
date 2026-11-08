import test from 'node:test';
import assert from 'node:assert/strict';
import { sci, texSci, tickLabel } from './format.ts';

test('sci keeps moderate magnitudes plain and large ones scientific', () => {
  assert.equal(sci(2.25), '2.25');
  assert.equal(sci(11.4), '11.4');
  assert.equal(sci(-31), '-31');
  assert.equal(sci(0.0558), '0.0558');
  assert.equal(sci(225.4), '225');
  assert.equal(sci(7900), '7.9 × 10³');
  assert.equal(sci(1e16), '1 × 10¹⁶');
  assert.equal(sci(-1.78e-15), '-1.78 × 10⁻¹⁵');
  assert.equal(sci(0), '0');
});

test('sci carries mantissa rounding into the exponent', () => {
  assert.equal(sci(9.9999e18), '1 × 10¹⁹');
  assert.equal(texSci(9.9999e18), '1\\times10^{19}');
});

test('texSci mirrors sci in TeX', () => {
  assert.equal(texSci(2.25), '2.25');
  assert.equal(texSci(1.6e-19), '1.6\\times10^{-19}');
});

test('tick labels avoid e-notation', () => {
  assert.equal(tickLabel(500), '500');
  assert.equal(tickLabel(-1000), '-1000');
  assert.equal(tickLabel(20000), '2×10⁴');
  assert.equal(tickLabel(1e7), '10⁷');
  assert.equal(tickLabel(-1e4), '−10⁴');
  assert.equal(tickLabel(8e19), '8×10¹⁹');
  assert.equal(tickLabel(0.25), '0.25');
  assert.equal(tickLabel(0), '0');
});
