import { epsSi, ni, pnDepletion, q, requirePositive, thermalVoltage } from './physics.ts';

export function diodeCapacitances({
  donorDensity,
  area,
  lifetime,
  voltage,
  acceptorDensity = 1e18,
  holeDiffusivity = 11,
  temperature = 300,
}: {
  donorDensity: number;
  area: number;
  lifetime: number;
  voltage: number;
  acceptorDensity?: number;
  holeDiffusivity?: number;
  temperature?: number;
}) {
  requirePositive(donorDensity, 'Donor density');
  requirePositive(acceptorDensity, 'Acceptor density');
  requirePositive(area, 'Area');
  requirePositive(lifetime, 'Lifetime');
  requirePositive(holeDiffusivity, 'Hole diffusivity');
  requirePositive(temperature, 'Temperature');
  if (!Number.isFinite(voltage)) throw Error('Applied voltage must be finite.');
  const depletion = pnDepletion(acceptorDensity, donorDensity, temperature, voltage);
  const vt = thermalVoltage(temperature);
  const holeEquilibrium = ni(temperature) ** 2 / donorDensity;
  const holeLength = Math.sqrt(holeDiffusivity * lifetime);
  const saturationCurrent = (q * area * holeDiffusivity * holeEquilibrium) / holeLength;
  const expBias = Math.exp(voltage / vt);
  const current = saturationCurrent * Math.expm1(voltage / vt);
  const conductance = (saturationCurrent * expBias) / vt;
  const storedExcessCharge = q * area * holeLength * holeEquilibrium * Math.expm1(voltage / vt);
  const depletionChargeMagnitude = q * area * donorDensity * depletion.xn;
  const junctionCapacitance = (epsSi * area) / depletion.W;
  const diffusionCapacitance = lifetime * conductance;
  return {
    builtInVoltage: depletion.vbi,
    depletionWidth: depletion.W,
    depletionChargeMagnitude,
    holeEquilibrium,
    holeLength,
    holeEdgeExcess: holeEquilibrium * Math.expm1(voltage / vt),
    saturationCurrent,
    current,
    conductance,
    storedExcessCharge,
    junctionCapacitance,
    diffusionCapacitance,
    totalCapacitance: junctionCapacitance + diffusionCapacitance,
  };
}
