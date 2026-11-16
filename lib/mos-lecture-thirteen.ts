import { mosCvAt, mosSeriesCapacitances, type MosCvParams } from './mos-charge-cv.ts';

const q = 1.602176634e-19;
const eps0 = 8.8541878128e-14; // F/cm
const epsSi = 11.7 * eps0;
const epsOx = 3.9 * eps0;

export function deepDepletionAt(
  gateVoltage: number,
  params: MosCvParams,
  elapsedMs: number,
  generationMs: number,
  contacted = false,
) {
  const equilibrium = mosCvAt(gateVoltage, params);
  const threshold = equilibrium.threshold;
  const thresholdWidth = mosCvAt(threshold, params).depletionWidth;
  const excessBias = Math.max(0, gateVoltage - params.flatBand);
  const a = (q * params.acceptors) / (2 * epsSi);
  const b = (q * params.acceptors) / equilibrium.oxideCapacitance;
  const noInversionWidth = (-b + Math.sqrt(b * b + 4 * a * excessBias)) / (2 * a);
  const recovery = contacted ? 1 : 1 - Math.exp(-Math.max(0, elapsedMs) / generationMs);
  const depleted = gateVoltage >= threshold;
  const width = depleted
    ? thresholdWidth + (noInversionWidth - thresholdWidth) * (1 - recovery)
    : equilibrium.depletionWidth;
  const capacitance = mosSeriesCapacitances(equilibrium.oxideCapacitance, width).seriesCapacitance;
  return {
    ...equilibrium,
    thresholdWidth,
    noInversionWidth,
    width,
    recovery,
    capacitance,
    deepDepletion: depleted && width > thresholdWidth * 1.005,
  };
}

export function oxideChargeState({
  oxideNm,
  fixedIons,
  mobileIons,
  ionPosition,
  idealFlatBand,
  acceptors,
  trapStretch,
  implantIons,
  gateVoltage,
}: {
  oxideNm: number;
  fixedIons: number;
  mobileIons: number;
  ionPosition: number; // 0 at metal, 1 at Si interface
  idealFlatBand: number;
  acceptors: number;
  trapStretch: number;
  implantIons: number;
  gateVoltage: number;
}) {
  const oxideCapacitance = epsOx / (oxideNm * 1e-7);
  const effectiveIons = fixedIons + mobileIons * ionPosition;
  const flatBandShift = (-q * effectiveIons) / oxideCapacitance;
  const flatBand = idealFlatBand + flatBandShift;
  const implantShift = (q * implantIons) / oxideCapacitance;
  const base = mosCvAt(gateVoltage, { acceptors, oxideNm, flatBand });
  const threshold = flatBand + (base.threshold - flatBand + implantShift) * (1 + trapStretch);
  const ramp = Math.max(0, Math.min(1, (gateVoltage - flatBand) / (base.threshold - flatBand)));
  const effectiveGate =
    gateVoltage < flatBand
      ? gateVoltage
      : flatBand + (gateVoltage - flatBand - implantShift * ramp) / (1 + trapStretch);
  const capacitance = mosCvAt(effectiveGate, { acceptors, oxideNm, flatBand }).highFrequency;
  return { oxideCapacitance, effectiveIons, flatBandShift, flatBand, threshold, capacitance };
}

export function gateStackState({
  oxideNm,
  polyDoping,
  oxideFieldMvCm,
  inversionDepthNm,
}: {
  oxideNm: number;
  polyDoping: number;
  oxideFieldMvCm: number;
  inversionDepthNm: number;
}) {
  const oxideCm = oxideNm * 1e-7;
  const field = oxideFieldMvCm * 1e6; // V/cm
  const oxideCapacitance = epsOx / oxideCm;
  const sheetCharge = epsOx * field;
  const polyWidthCm = sheetCharge / (q * polyDoping);
  const polyVoltage = (q * polyDoping * polyWidthCm * polyWidthCm) / (2 * epsSi);
  const effectiveNm = oxideNm + (polyWidthCm * 1e7 + inversionDepthNm) / 3;
  const effectiveCapacitance = epsOx / (effectiveNm * 1e-7);
  return {
    oxideCapacitance,
    effectiveCapacitance,
    sheetCharge,
    polyWidthNm: polyWidthCm * 1e7,
    polyVoltage,
    oxideVoltage: field * oxideCm,
    effectiveNm,
    capacitanceRatio: effectiveCapacitance / oxideCapacitance,
  };
}
