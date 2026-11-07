export const ELEMENTARY_CHARGE = 1.602176634e-19;

export function solarCollection({
  absorptionDepthMicrons,
  diffusionLengthMicrons,
  antiReflectionCoating,
}: {
  absorptionDepthMicrons: number;
  diffusionLengthMicrons: number;
  antiReflectionCoating: boolean;
}) {
  if (
    !Number.isFinite(absorptionDepthMicrons) ||
    absorptionDepthMicrons < 0 ||
    !Number.isFinite(diffusionLengthMicrons) ||
    diffusionLengthMicrons <= 0
  ) {
    throw Error('Absorption depth must be nonnegative and diffusion length positive.');
  }
  // Illustrative optical fractions; the diffusion factor is a long-base approximation.
  const opticalTransmission = antiReflectionCoating ? 0.95 : 0.65;
  const minorityCollectionFraction = Math.exp(-absorptionDepthMicrons / diffusionLengthMicrons);
  return {
    opticalTransmission,
    minorityCollectionFraction,
    illustrativeCollectedFraction: opticalTransmission * minorityCollectionFraction,
  };
}

export function ledEmission({
  bandGapEv,
  currentMa,
  radiativeFraction,
}: {
  bandGapEv: number;
  currentMa: number;
  radiativeFraction: number;
}) {
  if (
    !Number.isFinite(bandGapEv) ||
    bandGapEv <= 0 ||
    !Number.isFinite(currentMa) ||
    currentMa < 0 ||
    !Number.isFinite(radiativeFraction) ||
    radiativeFraction < 0 ||
    radiativeFraction > 1
  ) {
    throw Error(
      'LED inputs must have positive gap, nonnegative current, and radiative fraction from zero to one.',
    );
  }
  const wavelengthNm = 1240 / bandGapEv;
  const injectedPairsPerSecond = (currentMa * 1e-3) / ELEMENTARY_CHARGE;
  const generatedPhotonsPerSecond = injectedPairsPerSecond * radiativeFraction;
  const photonColor =
    wavelengthNm >= 620
      ? '#ef5a47'
      : wavelengthNm >= 590
        ? '#efaa39'
        : wavelengthNm >= 560
          ? '#d9c33e'
          : wavelengthNm >= 500
            ? '#4fbb75'
            : '#4689e7';
  return { wavelengthNm, injectedPairsPerSecond, generatedPhotonsPerSecond, photonColor };
}
