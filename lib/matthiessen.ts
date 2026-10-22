import { q } from './physics.ts';

export function matthiessen(T: number, density: number, phonons = true, impurities = true) {
  if (!Number.isFinite(T) || T <= 0 || !Number.isFinite(density) || density <= 0)
    throw Error('Temperature and ionized dopant density must be positive and finite.');
  // Illustrative reference limits, not a fitted silicon mobility table.
  const phonon = 1400 * (T / 300) ** -1.5;
  const impurity = 1400 * (T / 300) ** 1.5 * (1e16 / density);
  const phononRate = phonons ? 1 / phonon : 0;
  const impurityRate = impurities ? 1 / impurity : 0;
  const totalRate = phononRate + impurityRate;
  const total = totalRate > 0 ? 1 / totalRate : null;
  return {
    phonon,
    impurity,
    total,
    phononRate,
    impurityRate,
    phononShare: totalRate ? phononRate / totalRate : 0,
    impurityShare: totalRate ? impurityRate / totalRate : 0,
    tauPs: total === null ? null : ((total * 1e-4 * (0.26 * 9.1093837e-31)) / q) * 1e12,
  };
}
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: [number, number][];
  flash: number;
  cause: 'phonon' | 'impurity';
};
export type MatthiessenScene = { seed: number; lanes: Particle[][] };
export function makeMatthiessenScene(): MatthiessenScene {
  return {
    seed: 121,
    lanes: Array.from({ length: 3 }, () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: 20 + i * 53,
        y: 12 + ((i * 17) % 43),
        vx: Math.cos(i * 2.4),
        vy: Math.sin(i * 2.4),
        trail: [],
        flash: 0,
        cause: 'phonon',
      })),
    ),
  };
}
export function advanceMatthiessen(
  scene: MatthiessenScene,
  dt: number,
  model: ReturnType<typeof matthiessen>,
  T: number,
): MatthiessenScene {
  if (!Number.isFinite(dt) || dt < 0 || !Number.isFinite(T) || T <= 0)
    throw Error('Invalid animation step.');
  let seed = scene.seed;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed + 0.5) / 4294967296;
  };
  // Slow, bounded visual rates. The readouts use the uncapped mobility model.
  const a = Math.min(15, 1260 / model.phonon),
    b = Math.min(15, 1260 / model.impurity);
  const rates = [
    [a, 0],
    [0, b],
    [model.phononRate > 0 ? a : 0, model.impurityRate > 0 ? b : 0],
  ];
  const lanes = scene.lanes.map((lane, i) =>
    lane.map((old) => {
      let { vx, vy, cause } = old,
        flash = Math.max(0, old.flash - dt * 3);
      const [pa, pb] = rates[i],
        rate = pa + pb;
      if (rate > 0 && random() < -Math.expm1(-rate * dt)) {
        const angle = random() * Math.PI * 2;
        vx = Math.cos(angle);
        vy = Math.sin(angle);
        cause = random() * rate < pa ? 'phonon' : 'impurity';
        flash = 1;
      }
      vx -= dt * 0.5;
      const magnitude = Math.hypot(vx, vy) || 1;
      vx /= magnitude;
      vy /= magnitude;
      let x = old.x + vx * 65 * Math.sqrt(T / 300) * dt,
        y = old.y + vy * 65 * Math.sqrt(T / 300) * dt;
      const wrapped = x < 8 || x > 552 || y < 7 || y > 63;
      x = 8 + ((((x - 8) % 544) + 544) % 544);
      y = 7 + ((((y - 7) % 56) + 56) % 56);
      return {
        x,
        y,
        vx,
        vy,
        cause,
        flash,
        trail: wrapped ? [] : [...old.trail.slice(-40), [old.x, old.y] as [number, number]],
      };
    }),
  );
  return { seed, lanes };
}
