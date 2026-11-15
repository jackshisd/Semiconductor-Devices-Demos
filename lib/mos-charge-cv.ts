// Ideal, one-dimensional p-type MOS capacitor at 300 K. Charges and capacitances
// are per unit area (C/cm² and F/cm²).
const q = 1.602176634e-19;
const eps0 = 8.8541878128e-14;
const epsSi = 11.7 * eps0;
const epsOx = 3.9 * eps0;
const thermalVoltage = 0.025852;
const intrinsicDensity = 1e10;

export type MosCvParams = {
  acceptors: number;
  oxideNm: number;
  flatBand: number;
};

// Illustrative minority-carrier response. A measured MOS capacitor also has
// loss and phase lag, which this scalar teaching model does not represent.
export const minorityResponseFrequency = 1e3;

export function minorityResponse(frequencyHz: number) {
  if (!Number.isFinite(frequencyHz) || frequencyHz < 0)
    throw new RangeError('Probe frequency must be a finite nonnegative number.');
  const ratio = frequencyHz / minorityResponseFrequency;
  return 1 / (1 + ratio * ratio);
}

export function measuredMosCapacitance(
  lowFrequency: number,
  highFrequency: number,
  frequencyHz: number,
) {
  return highFrequency + (lowFrequency - highFrequency) * minorityResponse(frequencyHz);
}

export function mosSeriesCapacitances(oxideCapacitance: number, depletionWidth: number) {
  if (
    !Number.isFinite(oxideCapacitance) ||
    oxideCapacitance <= 0 ||
    !Number.isFinite(depletionWidth) ||
    depletionWidth < 0
  ) {
    throw new RangeError('Oxide capacitance must be positive and depletion width nonnegative.');
  }
  const depletionCapacitance = depletionWidth === 0 ? Infinity : epsSi / depletionWidth;
  const seriesCapacitance =
    depletionWidth === 0
      ? oxideCapacitance
      : (oxideCapacitance * depletionCapacitance) / (oxideCapacitance + depletionCapacitance);
  return { depletionCapacitance, seriesCapacitance };
}

function chargeAtPotential(surfacePotential: number, acceptors: number) {
  const u = surfacePotential / thermalVoltage;
  const ratio = (intrinsicDensity / acceptors) ** 2;
  const holes = Math.expm1(-u) + u;
  const electrons = Math.expm1(u) - u;
  const factor = 2 * epsSi * q * thermalVoltage * acceptors;
  const totalMagnitude = Math.sqrt(Math.max(0, factor * (holes + ratio * electrons)));
  const total = -Math.sign(surfacePotential) * totalMagnitude;
  const accumulation = surfacePotential < 0 ? total : 0;
  const depletion = surfacePotential > 0 ? -Math.sqrt(Math.max(0, factor * holes)) : 0;
  const inversion = total - accumulation - depletion;
  return { total, accumulation, depletion, inversion };
}

function semiconductorCapacitance(
  surfacePotential: number,
  acceptors: number,
  minorityResponds: boolean,
) {
  const u = surfacePotential / thermalVoltage;
  const ratio = (intrinsicDensity / acceptors) ** 2;
  const holes = Math.expm1(-u) + u;
  const electrons = Math.expm1(u) - u;
  const factor = 2 * epsSi * q * thermalVoltage * acceptors;
  if (Math.abs(u) < 1e-5) return Math.sqrt((epsSi * q * acceptors * (1 + ratio)) / thermalVoltage);
  if (!minorityResponds && surfacePotential > 0) {
    return (Math.sqrt(factor) * (1 - Math.exp(-u))) / (2 * thermalVoltage * Math.sqrt(holes));
  }
  const derivative = 1 - Math.exp(-u) + ratio * Math.expm1(u);
  return (
    (Math.sqrt(factor) * Math.sign(surfacePotential) * derivative) /
    (2 * thermalVoltage * Math.sqrt(holes + ratio * electrons))
  );
}

export function mosCvAt(gateVoltage: number, params: MosCvParams) {
  const oxideCapacitance = epsOx / (params.oxideNm * 1e-7);
  const fermiPotential = thermalVoltage * Math.log(params.acceptors / intrinsicDensity);
  const threshold =
    params.flatBand +
    2 * fermiPotential +
    Math.sqrt(4 * q * epsSi * params.acceptors * fermiPotential) / oxideCapacitance;
  let lo = -3;
  let hi = 3;
  for (let i = 0; i < 75; i++) {
    const mid = (lo + hi) / 2;
    const impliedGate =
      params.flatBand + mid - chargeAtPotential(mid, params.acceptors).total / oxideCapacitance;
    if (impliedGate < gateVoltage) lo = mid;
    else hi = mid;
  }
  const surfacePotential = (lo + hi) / 2;
  const charge = chargeAtPotential(surfacePotential, params.acceptors);
  const totalSemiconductor = semiconductorCapacitance(surfacePotential, params.acceptors, true);
  const depletionSemiconductor = semiconductorCapacitance(
    Math.min(surfacePotential, 2 * fermiPotential),
    params.acceptors,
    false,
  );
  const lowFrequency =
    (oxideCapacitance * totalSemiconductor) / (oxideCapacitance + totalSemiconductor);
  const respondingSemiconductor =
    surfacePotential > 0 ? depletionSemiconductor : totalSemiconductor;
  const highFrequency =
    (oxideCapacitance * respondingSemiconductor) / (oxideCapacitance + respondingSemiconductor);
  return {
    ...charge,
    surfacePotential,
    oxideCapacitance,
    lowFrequency,
    highFrequency,
    threshold,
    fermiPotential,
    depletionWidth:
      surfacePotential > 0
        ? Math.sqrt(
            (2 * epsSi * Math.min(surfacePotential, 2 * fermiPotential)) / (q * params.acceptors),
          )
        : 0,
  };
}
