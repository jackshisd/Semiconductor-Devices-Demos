/** Qualitative trajectories, in drawing units; not a calibrated transport solver. */
export type ScatteringKind = 'phonon' | 'impurity';
export type Carrier = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: [number, number][];
  flash: number;
};
export const ions = Array.from({ length: 32 }, (_, i) => ({
  x: 35 + ((i * 137) % 530),
  y: 35 + ((i * 83) % 250),
}));
export function scatteringTrend(kind: ScatteringKind, temperature: number, density: number) {
  const t = temperature / 300;
  return kind === 'phonon' ? t ** 1.5 : density / 1e16 / t ** 1.5;
}
export function makeCarriers(): Carrier[] {
  return Array.from({ length: 18 }, (_, i) => {
    const angle = i * 2.39996;
    return {
      x: 20 + ((i * 79) % 550),
      y: 20 + ((i * 53) % 280),
      vx: Math.cos(angle),
      vy: Math.sin(angle),
      trail: [],
      flash: 0,
    };
  });
}
export function advanceCarriers(
  carriers: Carrier[],
  dt: number,
  options: {
    kind: ScatteringKind;
    temperature: number;
    density: number;
    field: number;
    charge: number;
  },
  random: () => number = Math.random,
): Carrier[] {
  const { kind, temperature, density, field, charge } = options;
  if (
    !Number.isFinite(dt) ||
    dt < 0 ||
    !Number.isFinite(temperature) ||
    temperature <= 0 ||
    !Number.isFinite(density) ||
    density <= 0 ||
    ![-1, 0, 1].includes(field) ||
    ![-1, 1].includes(charge)
  )
    throw Error(
      'Scattering requires a finite nonnegative time step, positive temperature/density, and a valid field and ion charge.',
    );
  const speed = 65 * Math.sqrt(temperature / 300);
  const count = Math.max(2, Math.min(32, Math.round(2 + (Math.log10(density) - 14) * 7.5)));
  const active = ions.slice(0, count);
  return carriers.map((old) => {
    let { vx, vy } = old;
    let flash = Math.max(0, old.flash - dt * 3);
    if (kind === 'phonon') {
      if (random() < 1 - Math.exp(-2.5 * scatteringTrend(kind, temperature, density) * dt)) {
        const angle = random() * 2 * Math.PI;
        vx = Math.cos(angle);
        vy = Math.sin(angle);
        flash = 1;
      }
    } else {
      // Screened, softened Coulomb deflection. Faster electrons turn less per distance.
      for (const ion of active) {
        const dx = ion.x - old.x,
          dy = ion.y - old.y;
        const r2 = dx * dx + dy * dy + 180;
        const strength = (charge * 2100 * dt) / (r2 * Math.sqrt(r2)) / Math.sqrt(temperature / 300);
        vx += dx * strength;
        vy += dy * strength;
        if (r2 < 600) flash = 1;
      }
    }
    vx -= field * dt * 0.65;
    const magnitude = Math.hypot(vx, vy) || 1;
    vx /= magnitude;
    vy /= magnitude;
    let x = old.x + vx * speed * dt,
      y = old.y + vy * speed * dt;
    const wrapped = x < 8 || x > 592 || y < 8 || y > 312;
    if (x < 8) x = 592;
    else if (x > 592) x = 8;
    if (y < 8) y = 312;
    else if (y > 312) y = 8;
    const trail: [number, number][] = wrapped ? [] : [...old.trail.slice(-45), [old.x, old.y]];
    return { x, y, vx, vy, trail, flash };
  });
}
