export type MotionStage = 'generation' | 'diffusion' | 'drift' | 'collected';

export function photocarrierFrame(phase: number) {
  const t = ((phase % 1) + 1) % 1;
  const stage: MotionStage =
    t < 0.16 ? 'generation' : t < 0.54 ? 'diffusion' : t < 0.87 ? 'drift' : 'collected';
  const diffusionProgress = Math.max(0, Math.min(1, (t - 0.16) / 0.38));
  const driftProgress = Math.max(0, Math.min(1, (t - 0.54) / 0.33));
  const electronX =
    t < 0.54
      ? 170 +
        80 * diffusionProgress +
        7 * Math.sin(diffusionProgress * 8 * Math.PI) * Math.sin(diffusionProgress * Math.PI)
      : 250 + 170 * driftProgress;
  const electronY =
    t < 0.54
      ? 187 + 13 * Math.sin(diffusionProgress * 5 * Math.PI) * Math.sin(diffusionProgress * Math.PI)
      : 187;
  const holeX = 170 - 82 * Math.max(0, Math.min(1, (t - 0.16) / 0.68));
  const farProgress = Math.max(0, Math.min(1, (t - 0.16) / 0.29));
  return {
    stage,
    electronX,
    electronY,
    electronVisible: t >= 0.16 && t < 0.87,
    holeX,
    holeVisible: t >= 0.16 && t < 0.87,
    farElectronX: 96 + 26 * farProgress + 6 * Math.sin(farProgress * 5 * Math.PI),
    farElectronVisible: t >= 0.16 && t < 0.46,
    farRecombinationVisible: t >= 0.46 && t < 0.62,
    photonY: 38 + 140 * Math.min(1, t / 0.16),
    farPhotonY: 103 + 170 * Math.min(1, t / 0.16),
    photonVisible: t < 0.16,
  };
}
