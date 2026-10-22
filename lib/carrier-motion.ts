export const carrierSites = 8;
export type CarrierMotion = { hole: number; electron: number; phase: number };
export function advanceCarrierMotion(
  old: CarrierMotion,
  hops: number,
  direction: 1 | -1,
): CarrierMotion {
  const total = old.phase + hops;
  const complete = Math.floor(total);
  return {
    hole: (((old.hole + complete * direction) % carrierSites) + carrierSites) % carrierSites,
    electron: (old.electron + complete) % carrierSites,
    phase: total - complete,
  };
}
