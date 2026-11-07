import test from 'node:test';
import assert from 'node:assert/strict';
import {
  forwardCurrent,
  forwardVoltage,
  saturationCurrent,
  voltageSensitivity,
} from './diode-temperature-sensor.ts';

test('constant-current diode voltage falls as temperature rises', () => {
  const current = 300e-6;
  const cold = forwardVoltage(current, 248.15);
  const room = forwardVoltage(current, 298.15);
  const hot = forwardVoltage(current, 348.15);
  assert.ok(cold > room && room > hot);
  assert.ok(voltageSensitivity(current, 298.15) < -0.001);
  assert.ok(voltageSensitivity(current, 298.15) > -0.004);
});

test('the current and voltage forms of the sensor model invert each other', () => {
  for (const temperature of [248.15, 298.15, 348.15, 373.15]) {
    const current = 300e-6;
    assert.ok(saturationCurrent(temperature) > 0);
    const recovered = forwardCurrent(forwardVoltage(current, temperature), temperature);
    assert.ok(Math.abs(recovered / current - 1) < 1e-10);
  }
});
