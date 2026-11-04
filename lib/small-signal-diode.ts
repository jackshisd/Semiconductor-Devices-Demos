import { thermalVoltage } from './physics.ts';

export function smallSignalDiode({
  dcVoltage,
  acAmplitude,
  frequency,
  capacitance,
  saturationCurrent = 1e-12,
  temperature = 300,
}: {
  dcVoltage: number;
  acAmplitude: number;
  frequency: number;
  capacitance: number;
  saturationCurrent?: number;
  temperature?: number;
}) {
  if (
    ![dcVoltage, acAmplitude, frequency, capacitance, saturationCurrent, temperature].every(
      Number.isFinite,
    )
  )
    throw Error('Small-signal inputs must be finite.');
  if (
    dcVoltage < 0 ||
    acAmplitude < 0 ||
    frequency <= 0 ||
    capacitance < 0 ||
    saturationCurrent <= 0 ||
    temperature <= 0
  )
    throw Error('Small-signal inputs must be physical.');
  const vt = thermalVoltage(temperature);
  const expBias = Math.exp(dcVoltage / vt);
  const dcCurrent = saturationCurrent * Math.expm1(dcVoltage / vt);
  const conductance = (saturationCurrent * expBias) / vt;
  const resistance = 1 / conductance;
  const omega = 2 * Math.PI * frequency;
  const resistiveAmplitude = conductance * acAmplitude;
  const capacitiveAmplitude = omega * capacitance * acAmplitude;
  const totalAmplitude = Math.hypot(resistiveAmplitude, capacitiveAmplitude);
  const phaseLead = Math.atan2(capacitiveAmplitude, resistiveAmplitude);
  const atPhase = (phase: number) => {
    if (!Number.isFinite(phase)) throw Error('Phase must be finite.');
    const acVoltage = acAmplitude * Math.sin(phase);
    const resistiveCurrent = resistiveAmplitude * Math.sin(phase);
    const capacitiveCurrent = capacitiveAmplitude * Math.cos(phase);
    return {
      acVoltage,
      resistiveCurrent,
      capacitiveCurrent,
      totalCurrent: resistiveCurrent + capacitiveCurrent,
      exactDiodeIncrement: saturationCurrent * expBias * Math.expm1(acVoltage / vt),
    };
  };
  return {
    vt,
    dcCurrent,
    conductance,
    resistance,
    omega,
    resistiveAmplitude,
    capacitiveAmplitude,
    totalAmplitude,
    phaseLead,
    atPhase,
    diodeCurrent: (voltage: number) => saturationCurrent * Math.expm1(voltage / vt),
    tangentCurrent: (voltage: number) => dcCurrent + conductance * (voltage - dcVoltage),
  };
}
