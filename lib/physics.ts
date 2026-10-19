export const q = 1.602176634e-19;
export const eps0 = 8.8541878128e-14; // F/cm
export const epsSi = 12 * eps0;
export const kEV = 8.617333262145e-5; // eV/K
export const kJ = 1.380649e-23;
export const thermalVoltage = (T: number) => kEV * T;
export const bandgap = (T: number) => 1.17 - 4.73e-4 * T * T / (T + 636);
export const Nc = (T: number) => 2.8e19 * (T / 300) ** 1.5;
export const Nv = (T: number) => 1.04e19 * (T / 300) ** 1.5;
export const ni = (T: number) => Math.sqrt(Nc(T) * Nv(T)) * Math.exp(-bandgap(T) / (2 * thermalVoltage(T)));
export function requirePositive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) throw Error(`${name} must be positive.`);
  return value;
}
export function builtIn(NA: number, ND: number, T: number) {
  requirePositive(NA, 'Acceptor concentration');
  requirePositive(ND, 'Donor concentration');
  requirePositive(T, 'Temperature');
  const ratio = NA * ND / ni(T) ** 2;
  if (!(ratio > 1)) throw Error('Doping must exceed intrinsic concentration for this PN approximation.');
  return thermalVoltage(T) * Math.log(ratio);
}
export function pnDepletion(NA: number, ND: number, T: number, VA: number) {
  const vbi = builtIn(NA, ND, T),
    drop = vbi - VA;
  if (drop <= 0) throw Error('Applied forward bias exceeds built-in voltage; depletion approximation is invalid.');
  const W = Math.sqrt(2 * epsSi / q * (1 / NA + 1 / ND) * drop);
  const xp = W * ND / (NA + ND),
    xn = W * NA / (NA + ND);
  return {
    vbi,
    drop,
    W,
    xp,
    xn,
    Emax: q * NA * xp / epsSi
  };
}
export function pnFields(x: number, NA: number, ND: number, T: number, VA: number) {
  const d = pnDepletion(NA, ND, T, VA);
  const {
    xp,
    xn
  } = d;
  let rho = 0,
    E = 0,
    V = 0;
  if (x >= -xp && x < 0) {
    rho = -q * NA;
    E = -q * NA * (x + xp) / epsSi;
    V = q * NA * (x + xp) ** 2 / (2 * epsSi);
  } else if (x >= 0 && x <= xn) {
    rho = q * ND;
    E = q * ND * (x - xn) / epsSi;
    V = q * NA * xp * xp / (2 * epsSi) + q * ND * (xn * x - x * x / 2) / epsSi;
  } else if (x > xn) V = d.drop;
  return {
    rho,
    E,
    V
  };
}
export function doping(NA0: number, ND: number, L: number, x: number) {
  requirePositive(NA0, 'Acceptor concentration');
  requirePositive(ND, 'Donor concentration');
  requirePositive(L, 'Diffusion length');
  const NA = NA0 * Math.exp(-x / L);
  return {
    NA,
    ND,
    net: ND - NA,
    type: NA > ND ? 'p-type' : ('n-type' as 'p-type' | 'n-type')
  };
}
export function junctionPosition(NA0: number, ND: number, L: number) {
  return L * Math.log(NA0 / ND);
}
export function schottky(phiBn: number, ND: number, T: number, VA: number, epsilon = epsSi) {
  requirePositive(phiBn, 'Barrier height');
  requirePositive(ND, 'Donor concentration');
  requirePositive(epsilon, 'Permittivity');
  const offset = thermalVoltage(T) * Math.log(Nc(T) / ND);
  const vbi = phiBn - offset;
  const drop = vbi - VA;
  if (vbi <= 0) throw Error('Barrier and doping imply accumulation, not a depleted Schottky contact.');
  if (drop <= 0) throw Error('Forward bias exceeds built-in voltage; depletion approximation is invalid.');
  return {
    phiBn,
    vbi,
    drop,
    W: Math.sqrt(2 * epsilon * drop / (q * ND)),
    offset
  };
}
export function schottkyP(phiBp: number, NA: number, T: number, epsilon = epsSi) {
  const offset = thermalVoltage(T) * Math.log(Nv(T) / NA);
  const vbi = phiBp - offset;
  if (vbi <= 0) throw Error('P-type contact is not in depletion for these parameters.');
  return {
    phiBp,
    vbi,
    drop: vbi,
    W: Math.sqrt(2 * epsilon * vbi / (q * NA)),
    offset
  };
}
export function capacitance(ND: number, area: number, vbi: number, VA: number, epsilon = epsSi) {
  requirePositive(ND, 'Donor concentration');
  requirePositive(area, 'Area');
  requirePositive(epsilon, 'Permittivity');
  if (vbi - VA <= 0) throw Error('Bias is outside the depletion-capacitance regime.');
  const W = Math.sqrt(2 * epsilon * (vbi - VA) / (q * ND));
  const C = epsilon * area / W;
  return {
    W,
    C,
    invC2: 1 / (C * C),
    slope: -2 / (q * epsilon * area * area * ND),
    intercept: vbi
  };
}
// Complete Fermi–Dirac integral F_{1/2}(eta), with its standard 2/sqrt(pi) normalization.
export function fdHalf(eta: number) {
  const n = 400,
    upper = Math.sqrt(Math.max(36, eta + 30)),
    h = upper / n;
  let sum = 0;
  for (let i = 1; i < n; i++) {
    const s = i * h;
    sum += (i % 2 ? 4 : 2) * 2 * s * s / (1 + Math.exp(s * s - eta));
  }
  const end = 2 * upper * upper / (1 + Math.exp(upper * upper - eta));
  return 2 / Math.sqrt(Math.PI) * h * (sum + end) / 3;
}
export function inverseFdHalf(y: number) {
  requirePositive(y, 'Carrier concentration ratio');
  let lo = -40,
    hi = 100;
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    if (fdHalf(mid) < y) lo = mid;else hi = mid;
  }
  return (lo + hi) / 2;
}
export function fermiOffset(type: 'n' | 'p', N: number, T: number) {
  requirePositive(N, 'Dopant concentration');
  const eta = inverseFdHalf(N / (type === 'n' ? Nc(T) : Nv(T)));
  const edge = eta * thermalVoltage(T);
  const approx = thermalVoltage(T) * Math.log(N / (type === 'n' ? Nc(T) : Nv(T)));
  return {
    eta,
    edge,
    approx,
    degenerate: eta >= 0,
    boltzmannValid: eta <= -3
  };
}
export function advancedJunction(NA: number, ND: number, T: number) {
  const p = fermiOffset('p', NA, T),
    n = fermiOffset('n', ND, T);
  return {
    vbi: bandgap(T) + p.edge + n.edge,
    p,
    n
  };
}
export const um = (cm: number) => cm * 1e4;
