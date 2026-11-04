import test from 'node:test';
import assert from 'node:assert/strict';
import { cvDopingExperiment } from './cv-doping.ts';
import { epsSi, q } from './physics.ts';

const base = { lightDoping: 6e15, heavyDoping: 1.8e17, area: 1e-6 };

test('noise-free inverse-square fit recovers one-sided pn junction doping and built-in voltage', () => {
  const model = cvDopingExperiment(base);
  assert.ok(Math.abs(model.extractedLightDoping / base.lightDoping - 1) < 1e-12);
  assert.ok(Math.abs(model.extractedHeavyDoping / base.heavyDoping - 1) < 1e-11);
  assert.ok(Math.abs(model.extractedBuiltIn / model.vbi - 1) < 1e-12);
  assert.ok(
    Math.abs(model.slope / (-2 / (q * epsSi * base.area ** 2 * base.lightDoping)) - 1) < 1e-12,
  );
});

test('reverse bias lowers capacitance and deterministic noise perturbs the fitted answer', () => {
  const ideal = cvDopingExperiment(base);
  const noisy = cvDopingExperiment({ ...base, noisePercent: 2 });
  assert.ok(ideal.measurements[0].capacitance < ideal.measurements.at(-1).capacitance);
  assert.ok(ideal.slope < 0);
  assert.notEqual(noisy.extractedLightDoping, ideal.extractedLightDoping);
  assert.deepEqual(
    noisy.measurements,
    cvDopingExperiment({ ...base, noisePercent: 2 }).measurements,
  );
});

test('invalid inputs are rejected', () => {
  assert.throws(() => cvDopingExperiment({ ...base, area: 0 }));
  assert.throws(() => cvDopingExperiment({ ...base, heavyDoping: base.lightDoping }));
  assert.throws(() => cvDopingExperiment({ ...base, noisePercent: 10 }));
});
