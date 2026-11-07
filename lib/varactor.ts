export const varactorProfiles = {
  graded: { label: 'Linearly graded', dopingExponent: 1, capacitanceExponent: 1 / 3 },
  abrupt: { label: 'Abrupt', dopingExponent: 0, capacitanceExponent: 1 / 2 },
  hyperabrupt: { label: 'Hyperabrupt', dopingExponent: -1.5, capacitanceExponent: 2 },
} as const;

export type VaractorProfile = keyof typeof varactorProfiles;

export function varactorState({
  reverseVoltage,
  zeroBiasCapacitancePf,
  builtInVoltage,
  inductanceMicroH,
  profile,
}: {
  reverseVoltage: number;
  zeroBiasCapacitancePf: number;
  builtInVoltage: number;
  inductanceMicroH: number;
  profile: VaractorProfile;
}) {
  if (
    !Number.isFinite(reverseVoltage) ||
    reverseVoltage < 0 ||
    !Number.isFinite(zeroBiasCapacitancePf) ||
    zeroBiasCapacitancePf <= 0 ||
    !Number.isFinite(builtInVoltage) ||
    builtInVoltage <= 0 ||
    !Number.isFinite(inductanceMicroH) ||
    inductanceMicroH <= 0 ||
    !(profile in varactorProfiles)
  ) {
    throw Error('Varactor parameters must be finite and physically positive.');
  }
  const exponent = varactorProfiles[profile].capacitanceExponent;
  const widthRatio = (1 + reverseVoltage / builtInVoltage) ** exponent;
  const capacitancePf = zeroBiasCapacitancePf / widthRatio;
  const frequencyMHz =
    1 / (2 * Math.PI * Math.sqrt(inductanceMicroH * 1e-6 * capacitancePf * 1e-12)) / 1e6;
  return { capacitancePf, widthRatio, frequencyMHz, exponent };
}
