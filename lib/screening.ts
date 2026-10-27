import { epsSi, kJ, q, requirePositive } from './physics.ts';

// Linearized Debye screening for nondegenerate silicon. Density is in cm^-3;
// epsSi is in F/cm, so the intermediate length is in cm.
export function debyeLengthNm(carrierDensity: number, temperature: number) {
  requirePositive(carrierDensity, 'Mobile carrier density');
  requirePositive(temperature, 'Temperature');
  return 1e7 * Math.sqrt((epsSi * kJ * temperature) / (q * q * carrierDensity));
}

// Potential and field of one ion relative to its unscreened Coulomb values.
export function screeningRatios(distanceNm: number, lengthNm: number) {
  requirePositive(distanceNm, 'Distance');
  requirePositive(lengthNm, 'Debye length');
  const scaled = distanceNm / lengthNm;
  const potential = Math.exp(-scaled);
  return { potential, field: (1 + scaled) * potential };
}
