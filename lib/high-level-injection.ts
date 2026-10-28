import { ni, requirePositive, thermalVoltage } from './physics.ts';

// Quasi-equilibrium carrier product at the edge of the lightly doped neutral
// region, combined with local charge neutrality. Concentrations are cm^-3.
export function highLevelInjection(doping: number, forwardBias: number, temperature = 300) {
  requirePositive(doping, 'Light-side doping');
  requirePositive(temperature, 'Temperature');
  if (!Number.isFinite(forwardBias) || forwardBias < 0)
    throw Error('Forward bias must be finite and nonnegative.');
  const intrinsic = ni(temperature);
  const voltage = thermalVoltage(temperature);
  const exponential = Math.exp(forwardBias / voltage);
  const product = intrinsic * intrinsic * exponential;
  // Rationalized quadratic root avoids cancellation when minority << doping.
  const minority = (2 * product) / (Math.sqrt(doping * doping + 4 * product) + doping);
  const equilibriumProduct = intrinsic * intrinsic;
  const minority0 =
    (2 * equilibriumProduct) / (Math.sqrt(doping * doping + 4 * equilibriumProduct) + doping);
  const majority = doping + minority;
  const excess = minority - minority0;
  return {
    intrinsic,
    voltage,
    minority,
    minority0,
    majority,
    majority0: doping + minority0,
    excess,
    injectionRatio: minority / doping,
    onsetVoltage: voltage * Math.log((2 * doping * doping) / equilibriumProduct),
    lowLevelMinority: minority0 * exponential,
    // The exponential distance dependence is a teaching sketch. High-level
    // transport is ambipolar and need not share the low-level diffusion length.
    profile: (distanceInDiffusionLengths: number) => {
      if (!Number.isFinite(distanceInDiffusionLengths) || distanceInDiffusionLengths < 0)
        throw Error('Distance must be finite and nonnegative.');
      const localMinority = minority0 + excess * Math.exp(-distanceInDiffusionLengths);
      return { minority: localMinority, majority: doping + localMinority };
    },
  };
}
