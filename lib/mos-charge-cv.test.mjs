import test from 'node:test';
import assert from 'node:assert/strict';
import {
  measuredMosCapacitance,
  minorityResponse,
  mosCvAt,
  mosSeriesCapacitances,
} from './mos-charge-cv.ts';

const params = { acceptors: 1e16, oxideNm: 10, flatBand: 0 };

test('p-type MOS charge moves from holes to depleted acceptors to inversion electrons', () => {
  const accumulation = mosCvAt(-1, params);
  const flat = mosCvAt(0, params);
  const depletion = mosCvAt(0.3, params);
  const inversion = mosCvAt(1.5, params);
  assert.ok(accumulation.accumulation > 0);
  assert.ok(Math.abs(flat.total) < 1e-12);
  assert.ok(depletion.depletion < 0);
  assert.ok(Math.abs(depletion.inversion) < Math.abs(depletion.depletion) / 100);
  assert.ok(inversion.inversion < 0);
  for (const point of [accumulation, flat, depletion, inversion]) {
    assert.ok(
      Math.abs(point.total - point.accumulation - point.depletion - point.inversion) < 1e-16,
    );
  }
});

test('C–V falls in depletion, then frequency separates inversion response', () => {
  const accumulation = mosCvAt(-1, params);
  const depletion = mosCvAt(0.6, params);
  const inversion = mosCvAt(1.5, params);
  assert.ok(accumulation.lowFrequency > depletion.lowFrequency);
  assert.ok(inversion.lowFrequency > depletion.lowFrequency);
  assert.ok(inversion.lowFrequency > inversion.highFrequency * 5);
  assert.ok(Math.abs(accumulation.lowFrequency - accumulation.highFrequency) < 1e-15);
  assert.ok(inversion.highFrequency < accumulation.highFrequency);
});

test('thicker oxide and stronger doping raise the p-type threshold', () => {
  const base = mosCvAt(0, params).threshold;
  assert.ok(mosCvAt(0, { ...params, oxideNm: 20 }).threshold > base);
  assert.ok(mosCvAt(0, { ...params, acceptors: 1e17 }).threshold > base);
});

test('probe frequency moves inversion capacitance from low to high frequency limit', () => {
  const inversion = mosCvAt(1.5, params);
  const accumulation = mosCvAt(-1, params);
  const capacitance = (state, frequency) =>
    measuredMosCapacitance(state.lowFrequency, state.highFrequency, frequency);
  assert.equal(minorityResponse(0), 1);
  assert.ok(minorityResponse(1e6) < 1e-5);
  assert.ok(capacitance(inversion, 1) > capacitance(inversion, 1e3));
  assert.ok(capacitance(inversion, 1e3) > capacitance(inversion, 1e6));
  assert.ok(Math.abs(capacitance(inversion, 1e6) - inversion.highFrequency) < 1e-12);
  assert.equal(capacitance(accumulation, 1), capacitance(accumulation, 1e6));
  assert.throws(() => minorityResponse(-1), RangeError);
});

test('a wider depletion layer lowers the series capacitance below oxide capacitance', () => {
  const oxide = mosCvAt(0.5, params).oxideCapacitance;
  const flat = mosSeriesCapacitances(oxide, 0);
  const narrow = mosSeriesCapacitances(oxide, 1e-5);
  const wide = mosSeriesCapacitances(oxide, 3e-5);
  assert.equal(flat.seriesCapacitance, oxide);
  assert.equal(flat.depletionCapacitance, Infinity);
  assert.ok(narrow.seriesCapacitance < oxide);
  assert.ok(wide.depletionCapacitance < narrow.depletionCapacitance);
  assert.ok(wide.seriesCapacitance < narrow.seriesCapacitance);
  assert.ok(wide.seriesCapacitance < wide.depletionCapacitance);
  assert.throws(() => mosSeriesCapacitances(oxide, -1), RangeError);
});
