export const q = 1.602176634e-19;
export const eps0 = 8.8541878128e-14; // F/cm
export const epsSi = 11.7 * eps0; // Lecture 5 bulk-Si value; the NiSi exercise specifies 12 eps0 separately.
export const kEV = 8.617333262145e-5; // eV/K
export const kJ = 1.380649e-23;
export const thermalVoltage = (T: number) => kEV * T;
// The lecture values at 300 K are Eg = 1.12 eV, Nc = 2.82e19 and Nv = 1.83e19 cm^-3.
// Keep Varshni's temperature dependence while anchoring the rounded course value at 300 K.
const varshni = (T: number) => 1.17 - 4.73e-4 * T * T / (T + 636);
export const bandgap = (T: number) => 1.12 + varshni(T) - varshni(300);
export const Nc = (T: number) => 2.82e19 * (T / 300) ** 1.5;
export const Nv = (T: number) => 1.83e19 * (T / 300) ** 1.5;
export const ni = (T: number) => Math.sqrt(Nc(T) * Nv(T)) * Math.exp(-bandgap(T) / (2 * thermalVoltage(T)));
// Intrinsic level relative to the middle of the gap, under Boltzmann statistics.
export const intrinsicMidgapOffset = (T: number) => thermalVoltage(T) / 2 * Math.log(Nv(T) / Nc(T));
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
  requirePositive(T, 'Temperature');
  requirePositive(epsilon, 'Permittivity');
  if (!Number.isFinite(VA)) throw Error('Applied voltage must be finite.');
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
  requirePositive(phiBp, 'Hole barrier height');
  requirePositive(NA, 'Acceptor concentration');
  requirePositive(T, 'Temperature');
  requirePositive(epsilon, 'Permittivity');
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
  requirePositive(vbi, 'Built-in voltage');
  requirePositive(epsilon, 'Permittivity');
  if (!Number.isFinite(VA)) throw Error('Applied voltage must be finite.');
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
    degenerate: eta > -3,
    insideBand: eta >= 0,
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

// Low-field drift-diffusion, nondegenerate Einstein relation; densities in cm^-3.
export function electronTransport(n: number, gradient: number, field: number, mobility: number, T: number) {
  requirePositive(n, 'Electron density');
  requirePositive(mobility, 'Electron mobility');
  requirePositive(T, 'Temperature');
  const D = mobility * thermalVoltage(T);
  const drift = q * mobility * n * field;
  const diffusion = q * D * gradient;
  return { D, drift, diffusion, total: drift + diffusion, equilibriumField: -thermalVoltage(T) * gradient / n };
}

// Steady-state excess minority holes in a uniformly doped n-type half-space.
export function minorityHoles(x: number, excessAtEdge: number, mobility: number, lifetime: number, T: number) {
  requirePositive(excessAtEdge, 'Excess hole concentration');
  requirePositive(mobility, 'Hole mobility');
  requirePositive(lifetime, 'Minority carrier lifetime');
  requirePositive(T, 'Temperature');
  const D = mobility * thermalVoltage(T);
  const L = Math.sqrt(D * lifetime);
  const excess = excessAtEdge * Math.exp(-x / L);
  return { D, L, excess, recombination: excess / lifetime, diffusionCurrent: q * D * excess / L };
}

// Ideal long-base step junction; complete ionization, low-level injection, no depletion recombination.
export function idealDiode(NA: number, ND: number, VA: number, T: number, lifetime: number, muN = 1400, muP = 470) {
  requirePositive(NA, 'Acceptor concentration');
  requirePositive(ND, 'Donor concentration');
  requirePositive(T, 'Temperature');
  requirePositive(lifetime, 'Minority carrier lifetime');
  requirePositive(muN, 'Electron mobility');
  requirePositive(muP, 'Hole mobility');
  const Dn = muN * thermalVoltage(T), Dp = muP * thermalVoltage(T);
  const Ln = Math.sqrt(Dn * lifetime), Lp = Math.sqrt(Dp * lifetime);
  const np0 = ni(T) ** 2 / NA, pn0 = ni(T) ** 2 / ND;
  const injection = Math.exp(VA / thermalVoltage(T));
  const J0 = q * (Dn * np0 / Ln + Dp * pn0 / Lp);
  const J = J0 * Math.expm1(VA / thermalVoltage(T));
  return { Dn, Dp, Ln, Lp, np0, pn0, injection, J0, J, npEdge: np0 * injection, pnEdge: pn0 * injection,
    lowInjection: np0 * injection < .1 * NA && pn0 * injection < .1 * ND };
}

// Local 1D continuity balance over a slice of length cm. Delta J is right-face minus left-face current density.
export function continuityRates(deltaJn: number, deltaJp: number, length: number, generation: number, recombination: number) {
  requirePositive(length, 'Slice length');
  for (const [value, name] of [[deltaJn, 'Electron current difference'], [deltaJp, 'Hole current difference'],
    [generation, 'Generation rate'], [recombination, 'Recombination rate']] as const) {
    if (!Number.isFinite(value) || (name.endsWith('rate') && value < 0)) throw Error(`${name} must be finite and nonnegative where applicable.`);
  }
  const pairRate = generation - recombination;
  const electronRate = deltaJn / (q * length) + pairRate;
  const holeRate = -deltaJp / (q * length) + pairRate;
  return { pairRate, electronRate, holeRate, chargeRate: q * (holeRate - electronRate),
    currentDivergence: (deltaJn + deltaJp) / length };
}

// Uniform n-type Si, complete ionization, paired excess carriers, and nondegenerate statistics.
export function quasiFermi(ND: number, excess: number, T: number) {
  requirePositive(ND, 'Donor concentration');
  requirePositive(T, 'Temperature');
  if (!Number.isFinite(excess) || excess < 0) throw Error('Excess carrier density must be nonnegative.');
  const intrinsic = ni(T), Vt = thermalVoltage(T), Eg = bandgap(T);
  const n0 = (ND + Math.hypot(ND, 2 * intrinsic)) / 2;
  const p0 = intrinsic ** 2 / n0;
  const n = n0 + excess, p = p0 + excess;
  const Ec = Eg / 2 - intrinsicMidgapOffset(T), Ev = Ec - Eg;
  const equilibriumFermi = Vt * Math.log(n0 / intrinsic);
  const Fn = Vt * Math.log(n / intrinsic);
  const Fp = -Vt * Math.log(p / intrinsic);
  return { n0, p0, n, p, Ec, Ei: 0, Ev, equilibriumFermi, Fn, Fp, split: Fn - Fp,
    boltzmannValid: Ec - Fn >= 3 * Vt && Fp - Ev >= 3 * Vt };
}
