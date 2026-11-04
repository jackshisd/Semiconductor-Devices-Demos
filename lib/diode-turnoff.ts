import { thermalVoltage } from './physics.ts';

export function diodeTurnOff({
  forwardCurrent,
  reverseCurrent,
  lifetime,
  forwardVoltage = 0.65,
  reverseVoltage = -2,
  temperature = 300,
}: {
  forwardCurrent: number; // mA
  reverseCurrent: number; // mA magnitude
  lifetime: number; // µs
  forwardVoltage?: number;
  reverseVoltage?: number;
  temperature?: number;
}) {
  if (
    ![forwardCurrent, reverseCurrent, lifetime, forwardVoltage, reverseVoltage, temperature].every(
      Number.isFinite,
    )
  )
    throw Error('Turn-off inputs must be finite.');
  if (
    forwardCurrent <= 0 ||
    reverseCurrent <= 0 ||
    lifetime <= 0 ||
    forwardVoltage <= 0 ||
    reverseVoltage >= 0 ||
    temperature <= 0
  )
    throw Error('Turn-off inputs must be physical.');
  const initialCharge = forwardCurrent * lifetime; // mA·µs = nC
  const storageDelay = lifetime * Math.log1p(forwardCurrent / reverseCurrent);
  const illustrativeRecoveryTime = 0.35 * lifetime;
  const vt = thermalVoltage(temperature);
  const forwardFactor = Math.expm1(forwardVoltage / vt);
  const at = (time: number) => {
    if (!Number.isFinite(time)) throw Error('Time must be finite.');
    if (time < 0)
      return {
        charge: initialCharge,
        current: forwardCurrent,
        voltage: forwardVoltage,
        stage: 'forward' as const,
      };
    if (time < storageDelay) {
      const charge = Math.max(
        0,
        (initialCharge + reverseCurrent * lifetime) * Math.exp(-time / lifetime) -
          reverseCurrent * lifetime,
      );
      const voltage = vt * Math.log1p((charge / initialCharge) * forwardFactor);
      return { charge, current: -reverseCurrent, voltage, stage: 'storage' as const };
    }
    const after = time - storageDelay;
    const remaining = Math.exp(-after / illustrativeRecoveryTime);
    return {
      charge: 0,
      current: -reverseCurrent * remaining,
      voltage: after === 0 ? 0 : reverseVoltage * (1 - remaining),
      stage: 'recovery' as const,
    };
  };
  return { initialCharge, storageDelay, illustrativeRecoveryTime, at };
}
