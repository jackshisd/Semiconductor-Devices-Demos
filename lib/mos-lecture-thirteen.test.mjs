import test from 'node:test';
import assert from 'node:assert/strict';
import { deepDepletionAt, oxideChargeState, gateStackState } from './mos-lecture-thirteen.ts';

const capacitor = { acceptors: 1e16, oxideNm: 10, flatBand: 0 };

test('a fast sweep produces deep depletion, then minority carriers restore Cmin', () => {
  const immediate = deepDepletionAt(2, capacitor, 0, 3);
  const later = deepDepletionAt(2, capacitor, 20, 3);
  const contacted = deepDepletionAt(2, capacitor, 0, 3, true);
  assert.ok(immediate.width > immediate.thresholdWidth);
  assert.ok(immediate.capacitance < contacted.capacitance);
  assert.ok(later.width < immediate.width);
  assert.ok(later.capacitance > immediate.capacitance);
  assert.ok(Math.abs(contacted.width / contacted.thresholdWidth - 1) < 1e-10);
  assert.equal(deepDepletionAt(0, capacitor, 0, 3).deepDepletion, false);
});

function charge(overrides = {}) {
  return oxideChargeState({
    oxideNm: 10,
    fixedIons: 0,
    mobileIons: 0,
    ionPosition: 0.5,
    idealFlatBand: 0,
    acceptors: 1e16,
    trapStretch: 0,
    implantIons: 0,
    gateVoltage: 0.5,
    ...overrides,
  });
}

test('oxide charge and implant shift the expected MOS voltage features', () => {
  assert.ok(charge({ fixedIons: 1e11 }).flatBand < 0);
  assert.ok(charge({ fixedIons: -1e11 }).flatBand > 0);
  assert.ok(
    charge({ fixedIons: 1e11, oxideNm: 20 }).flatBand < charge({ fixedIons: 1e11 }).flatBand,
  );
  assert.ok(
    charge({ mobileIons: 1e11, ionPosition: 1 }).flatBand <
      charge({ mobileIons: 1e11, ionPosition: 0.2 }).flatBand,
  );
  assert.equal(charge({ implantIons: 1e11 }).flatBand, 0);
  assert.ok(charge({ implantIons: 1e11 }).threshold > charge().threshold);
});

test('poly depletion and inversion depth reduce gate capacitance', () => {
  const ordinary = gateStackState({
    oxideNm: 8,
    polyDoping: 1e19,
    oxideFieldMvCm: 1.2,
    inversionDepthNm: 1.5,
  });
  const heavilyDoped = gateStackState({
    oxideNm: 8,
    polyDoping: 1e20,
    oxideFieldMvCm: 1.2,
    inversionDepthNm: 1.5,
  });
  const deeperInversion = gateStackState({
    oxideNm: 8,
    polyDoping: 1e19,
    oxideFieldMvCm: 1.2,
    inversionDepthNm: 3,
  });
  assert.ok(heavilyDoped.polyWidthNm < ordinary.polyWidthNm);
  assert.ok(heavilyDoped.effectiveCapacitance > ordinary.effectiveCapacitance);
  assert.ok(deeperInversion.effectiveCapacitance < ordinary.effectiveCapacitance);
  assert.ok(ordinary.effectiveCapacitance < ordinary.oxideCapacitance);
});
