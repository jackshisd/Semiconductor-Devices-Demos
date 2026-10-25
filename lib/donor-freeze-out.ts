import { Nc, kEV, ni, requirePositive } from './physics.ts';

// Nondegenerate, uncompensated n-type Si with a 54 meV donor level below Ec.
// The donor degeneracy factor is 2. This extends the lecture's qualitative plot.
export function donorCarrierState(T: number, ND: number) {
  requirePositive(T, 'Temperature');
  requirePositive(ND, 'Donor concentration');
  const intrinsic = ni(T);
  const donorFactor = (2 * Math.exp(0.054 / (kEV * T))) / Nc(T);
  const ionizedAt = (n: number) => ND / (1 + donorFactor * n);
  let low = 0;
  let high = ND + intrinsic;
  for (let i = 0; i < 90; i++) {
    const n = (low + high) / 2;
    const balance = n - ionizedAt(n) - (intrinsic * intrinsic) / n;
    if (balance > 0) high = n;
    else low = n;
  }
  const n = (low + high) / 2;
  const ionized = ionizedAt(n);
  const regime = intrinsic >= ND ? 'Intrinsic' : ionized < 0.9 * ND ? 'Freeze-out' : 'Extrinsic';
  return { n, intrinsic, ionized, regime };
}
