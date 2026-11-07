const BOLTZMANN_EV = 8.617333262145e-5;
const BAND_GAP_EV = 1.12;
const REFERENCE_K = 298.15;
const REFERENCE_SATURATION_A = 1e-13;

export function saturationCurrent(temperatureK: number) {
  return (
    REFERENCE_SATURATION_A *
    (temperatureK / REFERENCE_K) ** 3 *
    Math.exp((-BAND_GAP_EV / BOLTZMANN_EV) * (1 / temperatureK - 1 / REFERENCE_K))
  );
}

export function forwardVoltage(currentA: number, temperatureK: number) {
  return BOLTZMANN_EV * temperatureK * Math.log1p(currentA / saturationCurrent(temperatureK));
}

export function forwardCurrent(voltage: number, temperatureK: number) {
  return saturationCurrent(temperatureK) * Math.expm1(voltage / (BOLTZMANN_EV * temperatureK));
}

export function voltageSensitivity(currentA: number, temperatureK: number) {
  return (
    (forwardVoltage(currentA, temperatureK + 0.1) - forwardVoltage(currentA, temperatureK - 0.1)) /
    0.2
  );
}
