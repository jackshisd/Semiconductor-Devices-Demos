export type MosfetOutput = {
  overdrive: number;
  saturationVoltage: number;
  region: 'off' | 'linear' | 'saturation';
  drainCurrent: number;
  idealCurrent: number;
  effectiveLengthRatio: number;
};

// Long-channel square-law teaching model. beta is in mA/V²; currents are in mA.
export function mosfetOutput(
  gateVoltage: number,
  drainVoltage: number,
  thresholdVoltage: number,
  beta: number,
  lambda: number,
): MosfetOutput {
  const overdrive = Math.max(0, gateVoltage - thresholdVoltage);
  const saturationVoltage = overdrive;
  if (overdrive === 0)
    return {
      overdrive,
      saturationVoltage,
      region: 'off',
      drainCurrent: 0,
      idealCurrent: 0,
      effectiveLengthRatio: 1,
    };
  const saturated = drainVoltage >= saturationVoltage;
  const idealCurrent = saturated
    ? (beta * overdrive ** 2) / 2
    : beta * (overdrive * drainVoltage - drainVoltage ** 2 / 2);
  const excessVoltage = Math.max(0, drainVoltage - saturationVoltage);
  const lengthFactor = 1 + lambda * excessVoltage;
  return {
    overdrive,
    saturationVoltage,
    region: saturated ? 'saturation' : 'linear',
    idealCurrent,
    drainCurrent: idealCurrent * lengthFactor,
    effectiveLengthRatio: 1 / lengthFactor,
  };
}
