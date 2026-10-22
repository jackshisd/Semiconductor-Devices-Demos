// Small, explicit models used in the Lecture 2 teaching demos.
import { ni, thermalVoltage } from './physics.ts';

export function atomicBands(atoms: number, gap = 1.12, width = 1.2) {
  if (!Number.isInteger(atoms) || atoms < 1 || atoms > 96) throw Error('Use 1–96 atoms.');
  if (!(gap > 0) || !Number.isFinite(gap) || !(width > 0) || !Number.isFinite(width))
    throw Error('Band gap and width must be positive and finite.');
  // Schematic splitting: 4N states per band (two spin states per drawn level).
  // The increasing near-edge density follows the lecture's 3D square-root DOS.
  const levels = 2 * atoms;
  const offsets = Array.from({ length: levels }, (_, i) => width * ((i + 0.5) / levels) ** (2 / 3));
  const valence = offsets.map((E) => -E).sort((a, b) => a - b);
  const conduction = offsets.map((E) => E + gap);
  const histogram = (energies: number[], start: number) => {
    const bins = Array.from({ length: 40 }, (_, i) => ({
      energy: start + ((i + 0.5) * width) / 40,
      density: 0,
    }));
    for (const E of energies)
      bins[Math.min(39, Math.max(0, Math.floor(((E - start) * 40) / width)))].density +=
        (2 * 40) / width;
    return bins;
  };
  return {
    atoms,
    gap,
    width,
    valence,
    conduction,
    valenceStates: 4 * atoms,
    conductionStates: 4 * atoms,
    finiteGap: conduction[0] - valence.at(-1)!,
    valenceDOS: histogram(valence, -width),
    conductionDOS: histogram(conduction, gap),
  };
}

export function equilibriumDoping(type: 'n' | 'p', dopant: number, T = 300) {
  if (!Number.isFinite(dopant) || dopant <= 0 || !Number.isFinite(T) || T <= 0)
    throw Error('Doping and temperature must be positive and finite.');
  const intrinsic = ni(T);
  const majority = (dopant + Math.hypot(dopant, 2 * intrinsic)) / 2;
  const minority = intrinsic * (intrinsic / majority);
  return {
    n: type === 'n' ? majority : minority,
    p: type === 'p' ? majority : minority,
    intrinsic,
    majority,
    minority,
  };
}

export function boltzmannComparison(offset: number, T: number, holes = false) {
  if (!Number.isFinite(offset) || !Number.isFinite(T) || T <= 0)
    throw Error('Energy must be finite and temperature positive.');
  const x = (offset / thermalVoltage(T)) * (holes ? -1 : 1);
  const tail = Math.exp(-Math.abs(x));
  const exact = x >= 0 ? tail / (1 + tail) : 1 / (1 + tail);
  const approximate = Math.exp(-x);
  return { x, exact, approximate, relativeError: approximate, valid: x >= 3 };
}

export type SandGrain = { id: number; x: number; y: number; vx: number; vy: number };
export type SandState = {
  grains: SandGrain[];
  seed: number;
  time: number;
  up: number;
  down: number;
};
const gravity = 3;
const height = 1;
const variance = (T: number) => 0.0005 * T;
function generator(seed: number) {
  let current = seed >>> 0;
  return {
    uniform() {
      current = (Math.imul(1664525, current) + 1013904223) >>> 0;
      return (current + 0.5) / 4294967296;
    },
    get seed() {
      return current;
    },
  };
}
export function makeSand(T = 300, count = 100): SandState {
  if (
    !Number.isFinite(T) ||
    T < 0 ||
    T > 1000 ||
    !Number.isInteger(count) ||
    count < 1 ||
    count > 300
  )
    throw Error('Invalid sand model settings.');
  const random = generator(121);
  const normal = () =>
    Math.sqrt(-2 * Math.log(random.uniform())) * Math.cos(2 * Math.PI * random.uniform());
  const scale = variance(T) / gravity;
  const grains = Array.from({ length: count }, (_, id) => ({
    id,
    x: 0.04 + 0.92 * random.uniform(),
    y: T === 0 ? 0 : -scale * Math.log(1 - random.uniform() * (1 - Math.exp(-height / scale))),
    vx: Math.sqrt(variance(T)) * normal(),
    vy: Math.sqrt(variance(T)) * normal(),
  }));
  return { grains, seed: random.seed, time: 0, up: 0, down: 0 };
}
export function advanceSand(state: SandState, T: number, dt: number): SandState {
  if (!Number.isFinite(T) || T < 0 || T > 1000 || !Number.isFinite(dt) || dt < 0 || dt > 0.25)
    throw Error('Invalid sand animation step.');
  const random = generator(state.seed);
  let grains = state.grains.map((grain) => ({ ...grain }));
  const steps = Math.max(1, Math.ceil(dt / 0.008));
  const step = dt / steps;
  let up = state.up,
    down = state.down;
  for (let index = 0; index < steps; index++)
    grains = grains.map((grain) => {
      let { x, y, vx, vy } = grain;
      x += vx * step;
      y += vy * step - 0.5 * gravity * step * step;
      vy -= gravity * step;
      if (x < 0.02) {
        x = 0.02;
        vx = Math.abs(vx);
      } else if (x > 0.98) {
        x = 0.98;
        vx = -Math.abs(vx);
      }
      if (y < 0) {
        y = 0;
        vy = Math.sqrt(-2 * variance(T) * Math.log(random.uniform()));
        vx =
          Math.sqrt(variance(T)) *
          Math.sqrt(-2 * Math.log(random.uniform())) *
          Math.cos(2 * Math.PI * random.uniform());
      }
      if (y > height) {
        y = height;
        vy = -Math.abs(vy);
      }
      if (grain.y < 0.18 && y >= 0.18) up++;
      if (grain.y >= 0.18 && y < 0.18) down++;
      return { ...grain, x, y, vx, vy };
    });
  return { grains, seed: random.seed, time: state.time + dt, up, down };
}
export function disturbSand(state: SandState): SandState {
  return {
    ...state,
    grains: state.grains.map((grain, index) => ({
      ...grain,
      vy: 1.1 + (index % 7) * 0.1,
      vx: ((index % 9) - 4) * 0.12,
    })),
  };
}
export function sandHighFraction(T: number, threshold = 0.18) {
  if (T <= 0) return 0;
  const scale = variance(T) / gravity;
  return (
    (Math.exp(-threshold / scale) - Math.exp(-height / scale)) / (1 - Math.exp(-height / scale))
  );
}
