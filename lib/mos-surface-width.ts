// Lecture 12 depletion-approximation model for a p-type MOS capacitor at 300 K.
const q = 1.602176634e-19;
const eps0 = 8.8541878128e-14;
const epsSi = 11.7 * eps0;
const epsOx = 3.9 * eps0;
const thermalVoltage = 0.025852;
const intrinsicDensity = 1e10;

export type MosSurfaceParams = {
  acceptors: number;
  oxideNm: number;
  flatBand: number;
};

export function mosSurfaceWidth(gateVoltage: number, params: MosSurfaceParams) {
  const oxideCapacitance = epsOx / (params.oxideNm * 1e-7);
  const fermiPotential = thermalVoltage * Math.log(params.acceptors / intrinsicDensity);
  const thresholdPotential = 2 * fermiPotential;
  const thresholdWidth = Math.sqrt((2 * epsSi * thresholdPotential) / (q * params.acceptors));
  const thresholdVoltage =
    params.flatBand +
    thresholdPotential +
    (q * params.acceptors * thresholdWidth) / oxideCapacitance;
  const depletionDrive = Math.max(0, Math.min(gateVoltage, thresholdVoltage) - params.flatBand);
  // Solve VG−VFB = ψs + √(2q εSi NA ψs)/Cox for √ψs.
  const a = Math.sqrt(2 * q * epsSi * params.acceptors) / oxideCapacitance;
  const rootPotential =
    depletionDrive === 0 ? 0 : (2 * depletionDrive) / (Math.sqrt(a * a + 4 * depletionDrive) + a);
  const surfacePotential = rootPotential * rootPotential;
  const depletionWidth = Math.sqrt((2 * epsSi * surfacePotential) / (q * params.acceptors));
  return {
    surfacePotential,
    depletionWidth,
    thresholdPotential,
    thresholdWidth,
    thresholdVoltage,
    oxideCapacitance,
    regime:
      gateVoltage < params.flatBand
        ? 'accumulation'
        : gateVoltage >= thresholdVoltage
          ? 'inversion'
          : 'depletion',
  };
}
