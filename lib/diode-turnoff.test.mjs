import test from 'node:test';
import assert from 'node:assert/strict';
import { diodeTurnOff } from './diode-turnoff.ts';

const base = { forwardCurrent: 10, reverseCurrent: 5, lifetime: 2 };

test('storage delay follows charge-control relation and charge reaches zero at its end', () => {
  const model = diodeTurnOff(base);
  assert.equal(model.initialCharge, 20);
  assert.ok(Math.abs(model.storageDelay - 2 * Math.log(3)) < 1e-12);
  assert.equal(model.at(0).current, -5);
  assert.equal(model.at(model.storageDelay).charge, 0);
  assert.equal(model.at(model.storageDelay).voltage, 0);
});

test('more forward charge delays turn-off; greater reverse extraction or faster recombination shortens it', () => {
  const reference = diodeTurnOff(base).storageDelay;
  assert.ok(diodeTurnOff({ ...base, forwardCurrent: 20 }).storageDelay > reference);
  assert.ok(diodeTurnOff({ ...base, reverseCurrent: 10 }).storageDelay < reference);
  assert.ok(diodeTurnOff({ ...base, lifetime: 1 }).storageDelay < reference);
});

test('during storage charge falls monotonically and post-storage current tail tends to zero', () => {
  const model = diodeTurnOff(base);
  const early = model.at(model.storageDelay / 4);
  const late = model.at((model.storageDelay * 3) / 4);
  assert.ok(early.charge > late.charge && late.charge > 0);
  assert.equal(early.current, -base.reverseCurrent);
  assert.ok(
    model.at(model.storageDelay + model.illustrativeRecoveryTime).current > -base.reverseCurrent,
  );
  assert.ok(model.at(model.storageDelay + model.illustrativeRecoveryTime).voltage < 0);
  assert.throws(() => diodeTurnOff({ ...base, reverseCurrent: 0 }));
});
