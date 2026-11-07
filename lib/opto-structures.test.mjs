import test from 'node:test';
import assert from 'node:assert/strict';
import { ELEMENTARY_CHARGE, ledEmission, solarCollection } from './opto-structures.ts';

test('deeper generation and shorter diffusion length reduce solar collection', () => {
  const near = solarCollection({
    absorptionDepthMicrons: 10,
    diffusionLengthMicrons: 60,
    antiReflectionCoating: true,
  });
  const far = solarCollection({
    absorptionDepthMicrons: 80,
    diffusionLengthMicrons: 60,
    antiReflectionCoating: true,
  });
  const uncoated = solarCollection({
    absorptionDepthMicrons: 10,
    diffusionLengthMicrons: 60,
    antiReflectionCoating: false,
  });
  assert.ok(near.minorityCollectionFraction > far.minorityCollectionFraction);
  assert.ok(near.illustrativeCollectedFraction > uncoated.illustrativeCollectedFraction);
  assert.ok(
    Math.abs(
      solarCollection({
        absorptionDepthMicrons: 60,
        diffusionLengthMicrons: 60,
        antiReflectionCoating: true,
      }).minorityCollectionFraction -
        Math.E ** -1,
    ) < 1e-12,
  );
  assert.throws(() =>
    solarCollection({
      absorptionDepthMicrons: -1,
      diffusionLengthMicrons: 60,
      antiReflectionCoating: true,
    }),
  );
});

test('LED band gap sets photon wavelength and current sets generation rate', () => {
  const red = ledEmission({ bandGapEv: 1240 / 650, currentMa: 10, radiativeFraction: 0.8 });
  const blue = ledEmission({ bandGapEv: 1240 / 450, currentMa: 20, radiativeFraction: 0.8 });
  assert.ok(Math.abs(red.wavelengthNm - 650) < 1e-10);
  assert.ok(Math.abs(blue.wavelengthNm - 450) < 1e-10);
  assert.equal(blue.injectedPairsPerSecond, 20e-3 / ELEMENTARY_CHARGE);
  assert.equal(blue.generatedPhotonsPerSecond, blue.injectedPairsPerSecond * 0.8);
  assert.ok(blue.generatedPhotonsPerSecond > red.generatedPhotonsPerSecond);
  assert.equal(
    ledEmission({ bandGapEv: 2, currentMa: 10, radiativeFraction: 0 }).generatedPhotonsPerSecond,
    0,
  );
  assert.throws(() => ledEmission({ bandGapEv: 2, currentMa: 10, radiativeFraction: 1.1 }));
});
