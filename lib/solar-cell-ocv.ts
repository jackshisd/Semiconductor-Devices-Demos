const THERMAL_VOLTAGE = 0.02585; // V at approximately 300 K
const ONE_SUN_PHOTOCURRENT = 50; // mA/cm², illustrative slide value

export function solarCellState({
  illuminationSuns,
  saturationCurrentAcm2,
  voltage,
}: {
  illuminationSuns: number;
  saturationCurrentAcm2: number;
  voltage: number;
}) {
  if (
    !Number.isFinite(illuminationSuns) ||
    illuminationSuns < 0 ||
    !Number.isFinite(saturationCurrentAcm2) ||
    saturationCurrentAcm2 <= 0 ||
    !Number.isFinite(voltage)
  ) {
    throw Error(
      'Solar-cell inputs must be finite, with nonnegative light and positive saturation current.',
    );
  }
  const lightCurrentMa = ONE_SUN_PHOTOCURRENT * illuminationSuns;
  const diodeCurrentMa = saturationCurrentAcm2 * 1000 * Math.expm1(voltage / THERMAL_VOLTAGE);
  const terminalCurrentMa = diodeCurrentMa - lightCurrentMa;
  const openCircuitVoltage =
    THERMAL_VOLTAGE * Math.log1p(lightCurrentMa / (saturationCurrentAcm2 * 1000));
  return {
    lightCurrentMa,
    diodeCurrentMa,
    terminalCurrentMa,
    outputPowerMw: -voltage * terminalCurrentMa,
    openCircuitVoltage,
    shortCircuitCurrentMa: lightCurrentMa,
  };
}

export function maximumPowerPoint(illuminationSuns: number, saturationCurrentAcm2: number) {
  const at = (voltage: number) =>
    solarCellState({ illuminationSuns, saturationCurrentAcm2, voltage });
  const voc = at(0).openCircuitVoltage;
  if (voc === 0) return { voltage: 0, currentMa: 0, powerMw: 0, fillFactor: 0 };
  // Golden-section search on the smooth, single-peaked power curve.
  let low = 0;
  let high = voc;
  const ratio = (Math.sqrt(5) - 1) / 2;
  let left = high - ratio * (high - low);
  let right = low + ratio * (high - low);
  for (let i = 0; i < 80; i++) {
    if (at(left).outputPowerMw < at(right).outputPowerMw) low = left;
    else high = right;
    left = high - ratio * (high - low);
    right = low + ratio * (high - low);
  }
  const voltage = (low + high) / 2;
  const state = at(voltage);
  return {
    voltage,
    currentMa: -state.terminalCurrentMa,
    powerMw: state.outputPowerMw,
    fillFactor: state.outputPowerMw / (state.shortCircuitCurrentMa * voc),
  };
}
