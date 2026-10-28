import test from 'node:test';
import assert from 'node:assert/strict';
import { highLevelInjection } from './high-level-injection.ts';

test('low injection matches the ideal minority boundary approximation', () => {
  const state = highLevelInjection(1e16, 0.3);
  assert.ok(Math.abs(state.minority / state.lowLevelMinority - 1) < 1e-4);
  assert.ok(state.injectionRatio < 1e-3);
  assert.ok(Math.abs(state.majority / 1e16 - 1) < 1e-3);
});

test('at onset minority reaches the light-side doping and majority doubles', () => {
  const base = highLevelInjection(1e15, 0);
  const state = highLevelInjection(1e15, base.onsetVoltage);
  assert.ok(Math.abs(state.injectionRatio - 1) < 1e-12);
  assert.ok(Math.abs(state.majority / 1e15 - 2) < 1e-12);
  assert.ok(state.lowLevelMinority > state.minority);
  assert.ok(Math.abs(state.profile(5).majority - 1e15) < state.excess);
});

test('invalid bias, density, and distance are rejected', () => {
  assert.throws(() => highLevelInjection(0, 0.5));
  assert.throws(() => highLevelInjection(1e15, -0.1));
  assert.throws(() => highLevelInjection(1e15, 0.5).profile(-1));
});
