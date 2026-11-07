import test from 'node:test';
import assert from 'node:assert/strict';
import { photocarrierFrame } from './photocarrier-motion.ts';

test('electron moves by diffusion before field-driven drift and collection', () => {
  const generated = photocarrierFrame(0.05);
  const diffusing = photocarrierFrame(0.3);
  const edge = photocarrierFrame(0.54);
  const drifting = photocarrierFrame(0.7);
  const collected = photocarrierFrame(0.9);
  assert.equal(generated.stage, 'generation');
  assert.equal(diffusing.stage, 'diffusion');
  assert.equal(edge.stage, 'drift');
  assert.equal(drifting.stage, 'drift');
  assert.equal(collected.stage, 'collected');
  assert.ok(diffusing.electronX > 170 && diffusing.electronX < 250);
  assert.equal(edge.electronX, 250);
  assert.ok(drifting.electronX > edge.electronX);
  assert.ok(collected.electronX > drifting.electronX);
  assert.equal(collected.electronVisible, false);
  assert.equal(generated.photonVisible, true);
});

test('distant photocarrier recombines before it reaches the junction', () => {
  assert.equal(photocarrierFrame(0.3).farElectronVisible, true);
  assert.equal(photocarrierFrame(0.5).farElectronVisible, false);
  assert.equal(photocarrierFrame(0.5).farRecombinationVisible, true);
  assert.ok(photocarrierFrame(0.45).farElectronX < 250);
});
