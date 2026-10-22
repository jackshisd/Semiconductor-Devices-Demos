// Slide values: L3 p23, 25, 28, 30. SI calculations, cm/s display speeds.
import { q, kJ } from './physics.ts';
export function transportScales(
  holes: boolean,
  temperature: number,
  field: number,
  tauPs?: number,
) {
  if (
    !Number.isFinite(temperature) ||
    temperature <= 0 ||
    !Number.isFinite(field) ||
    (tauPs !== undefined && (!Number.isFinite(tauPs) || tauPs <= 0))
  )
    throw Error('Invalid transport settings.');
  const mass = (holes ? 0.39 : 0.26) * 9.1093837e-31;
  const mobility = tauPs === undefined ? (holes ? 470 : 1400) : ((q * tauPs * 1e-12) / mass) * 1e4;
  const tau = tauPs === undefined ? (mobility * 1e-4 * mass) / q : tauPs * 1e-12;
  const thermal = Math.sqrt((3 * kJ * temperature) / mass) * 100;
  const saturation = holes ? 6e6 : 8e6;
  const lowField = mobility * field;
  const capped = Math.sign(field) * Math.min(Math.abs(lowField), saturation);
  return {
    mass,
    mobility,
    tau,
    thermal,
    lowField,
    capped,
    saturation,
    meanFreePathNm: (thermal / 100) * tau * 1e9,
  };
}

// Reproducible exponential free-flight intervals with mean tau. Dimensionless times.
export const collisionIntervals = Array.from(
  { length: 24 },
  (_, i) => -Math.log((((i * 13 + 7) % 29) + 0.5) / 29),
);
export const collisionTimes = collisionIntervals.reduce<number[]>(
  (times, interval) => [...times, times[times.length - 1] + interval],
  [0],
);
export function flightAt(time: number) {
  if (!Number.isFinite(time)) throw Error('Playback time must be finite.');
  const end = collisionTimes[collisionTimes.length - 1];
  const wrapped = time >= 0 ? time % end : ((time % end) + end) % end;
  const index = collisionTimes.findIndex((t, i) => i > 0 && t > wrapped) - 1;
  return {
    index,
    elapsed: wrapped - collisionTimes[index],
    interval: collisionIntervals[index],
    time: wrapped,
  };
}
