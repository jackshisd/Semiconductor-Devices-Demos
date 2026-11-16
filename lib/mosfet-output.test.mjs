import assert from 'node:assert/strict';
import test from 'node:test';
import { mosfetOutput } from './mosfet-output.ts';

test('pinch-off joins the linear and ideal saturation currents continuously', () => {
  const before = mosfetOutput(2, 1.1999, 0.8, 1, 0);
  const at = mosfetOutput(2, 1.2, 0.8, 1, 0);
  const after = mosfetOutput(2, 3, 0.8, 1, 0);
  assert.equal(before.region, 'linear');
  assert.equal(at.region, 'saturation');
  assert.ok(Math.abs(before.drainCurrent - at.drainCurrent) < 1e-7);
  assert.equal(after.drainCurrent, at.drainCurrent);
});

test('channel-length modulation shortens effective length and raises saturation current', () => {
  const at = mosfetOutput(2, 1.2, 0.8, 1, 0.1);
  const beyond = mosfetOutput(2, 3.2, 0.8, 1, 0.1);
  assert.ok(beyond.effectiveLengthRatio < at.effectiveLengthRatio);
  assert.ok(beyond.drainCurrent > at.drainCurrent);
  assert.equal(beyond.drainCurrent / at.drainCurrent, 1.2);
  assert.equal(mosfetOutput(0.5, 4, 0.8, 1, 0.1).drainCurrent, 0);
});
