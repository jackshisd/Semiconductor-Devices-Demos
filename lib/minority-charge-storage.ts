import { ni, q, requirePositive, thermalVoltage } from './physics.ts';

export function minorityChargeStorage({
  NA,
  ND,
  voltage,
  temperature = 300,
  electronDiffusivity = 35,
  holeDiffusivity = 11,
  lifetime = 1e-6,
}: {
  NA: number;
  ND: number;
  voltage: number;
  temperature?: number;
  electronDiffusivity?: number;
  holeDiffusivity?: number;
  lifetime?: number;
}) {
  requirePositive(NA, 'Acceptor density');
  requirePositive(ND, 'Donor density');
  requirePositive(temperature, 'Temperature');
  requirePositive(electronDiffusivity, 'Electron diffusivity');
  requirePositive(holeDiffusivity, 'Hole diffusivity');
  requirePositive(lifetime, 'Minority lifetime');
  if (!Number.isFinite(voltage)) throw Error('Applied voltage must be finite.');
  const intrinsic = ni(temperature);
  const electronEquilibrium = intrinsic ** 2 / NA;
  const holeEquilibrium = intrinsic ** 2 / ND;
  const edgeFactor = Math.expm1(voltage / thermalVoltage(temperature));
  const electronEdgeExcess = electronEquilibrium * edgeFactor;
  const holeEdgeExcess = holeEquilibrium * edgeFactor;
  const electronLength = Math.sqrt(electronDiffusivity * lifetime);
  const holeLength = Math.sqrt(holeDiffusivity * lifetime);
  const electronExcess = (distanceCm: number) => {
    if (!Number.isFinite(distanceCm) || distanceCm < 0)
      throw Error('Distance must be nonnegative.');
    return electronEdgeExcess * Math.exp(-distanceCm / electronLength);
  };
  const holeExcess = (distanceCm: number) => {
    if (!Number.isFinite(distanceCm) || distanceCm < 0)
      throw Error('Distance must be nonnegative.');
    return holeEdgeExcess * Math.exp(-distanceCm / holeLength);
  };
  return {
    intrinsic,
    electronEquilibrium,
    holeEquilibrium,
    edgeFactor,
    electronEdgeExcess,
    holeEdgeExcess,
    electronLength,
    holeLength,
    electronExcess,
    holeExcess,
    electronStoredChargePerArea: q * electronEdgeExcess * electronLength,
    holeStoredChargePerArea: q * holeEdgeExcess * holeLength,
  };
}
