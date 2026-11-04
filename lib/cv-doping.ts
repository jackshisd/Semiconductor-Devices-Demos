import { builtIn, epsSi, ni, q, requirePositive, thermalVoltage } from './physics.ts';

export function cvDopingExperiment({
  lightDoping,
  heavyDoping,
  area,
  noisePercent = 0,
  temperature = 300,
}: {
  lightDoping: number;
  heavyDoping: number;
  area: number;
  noisePercent?: number;
  temperature?: number;
}) {
  requirePositive(lightDoping, 'Light-side doping');
  requirePositive(heavyDoping, 'Heavy-side doping');
  requirePositive(area, 'Area');
  requirePositive(temperature, 'Temperature');
  if (!Number.isFinite(noisePercent) || noisePercent < 0 || noisePercent > 5)
    throw Error('Noise must be between 0 and 5%.');
  if (heavyDoping < 10 * lightDoping) throw Error('The junction must be at least 10:1 one-sided.');
  const vbi = builtIn(lightDoping, heavyDoping, temperature);
  const biases = Array.from({ length: 9 }, (_, index) => -2 + index * 0.25);
  const measurements = biases.map((voltage, index) => {
    const width = Math.sqrt((2 * epsSi * (vbi - voltage)) / (q * lightDoping));
    const idealCapacitance = (epsSi * area) / width;
    const repeatableError = (Math.sin((index + 1) * 2.37) * noisePercent) / 100;
    const capacitance = idealCapacitance * (1 + repeatableError);
    return { voltage, width, idealCapacitance, capacitance, inverseSquare: 1 / capacitance ** 2 };
  });
  const meanX = measurements.reduce((sum, point) => sum + point.voltage, 0) / measurements.length;
  const meanY =
    measurements.reduce((sum, point) => sum + point.inverseSquare, 0) / measurements.length;
  const slope =
    measurements.reduce(
      (sum, point) => sum + (point.voltage - meanX) * (point.inverseSquare - meanY),
      0,
    ) / measurements.reduce((sum, point) => sum + (point.voltage - meanX) ** 2, 0);
  const intercept = meanY - slope * meanX;
  const extractedLightDoping = 2 / (q * epsSi * area ** 2 * Math.abs(slope));
  const extractedBuiltIn = -intercept / slope;
  const extractedHeavyDoping =
    (ni(temperature) ** 2 / extractedLightDoping) *
    Math.exp(extractedBuiltIn / thermalVoltage(temperature));
  return {
    vbi,
    measurements,
    slope,
    intercept,
    extractedLightDoping,
    extractedBuiltIn,
    extractedHeavyDoping,
    fittedInverseSquare: (voltage: number) => slope * voltage + intercept,
  };
}
