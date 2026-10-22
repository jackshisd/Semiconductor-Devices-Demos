// Educational uniform-field models. Lengths are converted to cm for ionization
// and to SI units for the triangular-barrier WKB action.
export const IONIZATION_A = 7.03e5; // cm^-1, room-temperature silicon electron fit
export const IONIZATION_B = 1.231e6; // V/cm
const Q = 1.602176634e-19;
const HBAR = 1.054571817e-34;
const M0 = 9.1093837139e-31;

function positive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) throw Error(name + ' must be positive and finite.');
}
function nonnegative(value: number, name: string) {
  if (!Number.isFinite(value) || value < 0) throw Error(name + ' must be nonnegative and finite.');
}

export function avalancheModel(reverseVoltage: number, widthUm: number) {
  nonnegative(reverseVoltage, 'Reverse voltage');
  positive(widthUm, 'Depletion width');
  const widthCm = widthUm * 1e-4;
  const field = reverseVoltage / widthCm;
  const alpha = field > 0 ? IONIZATION_A * Math.exp(-IONIZATION_B / field) : 0;
  const opticalDepth = alpha * widthCm;
  return {
    reverseVoltage,
    widthUm,
    widthCm,
    field,
    alpha,
    opticalDepth,
    gain: Math.exp(opticalDepth), // electron-only, single-pass multiplication
    ionizationProbability: -Math.expm1(-opticalDepth),
  };
}

export function zenerModel(
  voltageDrop: number,
  widthNm: number,
  bandgap = 1.12,
  reducedMass = 0.08,
) {
  nonnegative(voltageDrop, 'Junction voltage drop');
  positive(widthNm, 'Junction width');
  positive(bandgap, 'Bandgap');
  positive(reducedMass, 'Reduced tunneling mass');
  const fieldSI = voltageDrop / (widthNm * 1e-9);
  const field = fieldSI / 100; // V/cm
  const tunnelDistanceNm = voltageDrop > 0 ? (bandgap * widthNm) / voltageDrop : Infinity;
  const action =
    fieldSI > 0
      ? (4 * Math.sqrt(2 * reducedMass * M0) * (bandgap * Q) ** 1.5) / (3 * Q * HBAR * fieldSI)
      : Infinity;
  // At this chosen electron energy, the destination conduction band must be accessible.
  const channelOpen = voltageDrop >= bandgap;
  const transmission = channelOpen ? Math.exp(-action) : 0;
  return {
    voltageDrop,
    widthNm,
    bandgap,
    reducedMass,
    field,
    tunnelDistanceNm,
    action,
    channelOpen,
    transmission,
    reflection: 1 - transmission,
  };
}

export function wkbEnvelope(model: ReturnType<typeof zenerModel>, positionNm: number) {
  nonnegative(positionNm, 'Position');
  if (model.field === 0) {
    return Math.exp(
      (-Math.sqrt(2 * model.reducedMass * M0 * model.bandgap * Q) * positionNm * 1e-9) / HBAR,
    );
  }
  const fraction = Math.min(1, positionNm / model.tunnelDistanceNm);
  return Math.exp((-model.action / 2) * (1 - (1 - fraction) ** 1.5));
}

export type AvalancheParticle = {
  id: number;
  kind: 'electron' | 'hole';
  x: number;
  y: number;
  age: number;
};
export type IonizationFlash = { id: number; x: number; y: number; age: number };
export type AvalancheState = {
  particles: AvalancheParticle[];
  flashes: IonizationFlash[];
  nextId: number;
  seeded: number;
  pairs: number;
  collectedElectrons: number;
  collectedHoles: number;
  sourceClock: number;
  limited: boolean;
};
export const MAX_ANIMATED_CARRIERS = 160;
export function emptyAvalanche(): AvalancheState {
  return {
    particles: [],
    flashes: [],
    nextId: 1,
    seeded: 0,
    pairs: 0,
    collectedElectrons: 0,
    collectedHoles: 0,
    sourceClock: 0,
    limited: false,
  };
}
export function injectElectron(state: AvalancheState, x = 0, y = 0.5): AvalancheState {
  if (state.particles.length >= MAX_ANIMATED_CARRIERS) return { ...state, limited: true };
  return {
    ...state,
    seeded: state.seeded + 1,
    nextId: state.nextId + 1,
    particles: [
      ...state.particles,
      {
        id: state.nextId,
        kind: 'electron',
        x: Math.max(0, Math.min(0.95, x)),
        y: Math.max(0.12, Math.min(0.88, y)),
        age: 0,
      },
    ],
  };
}

// Time and drift speeds are slowed for teaching. Collision likelihood is based
// on distance traveled, p = 1 - exp(-alpha dx), rather than playback speed.
export function advanceAvalanche(
  state: AvalancheState,
  model: ReturnType<typeof avalancheModel>,
  dt: number,
  automatic = false,
  random: () => number = Math.random,
): AvalancheState {
  nonnegative(dt, 'Animation time step');
  let next = {
    ...state,
    sourceClock: state.sourceClock + dt,
    particles: [] as AvalancheParticle[],
    flashes: state.flashes.map((f) => ({ ...f, age: f.age + dt })).filter((f) => f.age < 0.55),
  };
  const speed = 0.5 * Math.tanh(model.field / 1e5);
  for (const particle of state.particles) {
    const distance = speed * dt * (particle.kind === 'electron' ? 1 : 0.65);
    const end = particle.x + (particle.kind === 'electron' ? distance : -distance);
    const x = Math.max(0, Math.min(1, end));
    if (end >= 1) next.collectedElectrons++;
    else if (end <= 0 && particle.kind === 'hole') next.collectedHoles++;
    else next.particles.push({ ...particle, x, age: particle.age + dt });
    // Include the final segment before collection; never count travel outside the device.
    const traveled = Math.abs(x - particle.x);
    const probability = -Math.expm1(-model.alpha * model.widthCm * traveled);
    if (particle.kind === 'electron' && random() < probability) {
      // Reserve room for every unprocessed original carrier as well as the new pair.
      if (state.particles.length + 2 * (next.pairs - state.pairs) + 2 > MAX_ANIMATED_CARRIERS) {
        next.limited = true;
        continue;
      }
      const y = Math.max(0.14, Math.min(0.86, particle.y + (random() - 0.5) * 0.22));
      const collisionX = particle.x + traveled * 0.5;
      next.particles.push({ id: next.nextId++, kind: 'electron', x: collisionX, y, age: 0 });
      next.particles.push({
        id: next.nextId++,
        kind: 'hole',
        x: collisionX,
        y: Math.max(0.1, y - 0.08),
        age: 0,
      });
      next.flashes.push({ id: next.nextId++, x: collisionX, y: particle.y, age: 0 });
      next.pairs++;
    }
  }
  next.flashes = next.flashes.slice(-36);
  if (automatic && next.sourceClock >= 1.5) {
    next = {
      ...injectElectron(next, 0, 0.25 + random() * 0.5),
      sourceClock: next.sourceClock % 1.5,
    };
  }
  return next;
}
