export function chargeControlStep(
  chargePc: number,
  inletMicroA: number,
  lifetimeMicroS: number,
  elapsedMicroS: number,
) {
  if (![chargePc, inletMicroA, lifetimeMicroS, elapsedMicroS].every(Number.isFinite))
    throw Error('Charge-control inputs must be finite.');
  if (chargePc < 0 || inletMicroA < 0 || lifetimeMicroS <= 0 || elapsedMicroS < 0)
    throw Error('Charge, inlet, time, and lifetime must be physical.');
  const steadyChargePc = inletMicroA * lifetimeMicroS;
  return steadyChargePc + (chargePc - steadyChargePc) * Math.exp(-elapsedMicroS / lifetimeMicroS);
}

export function chargeControlRates(chargePc: number, inletMicroA: number, lifetimeMicroS: number) {
  if (![chargePc, inletMicroA, lifetimeMicroS].every(Number.isFinite))
    throw Error('Charge-control inputs must be finite.');
  if (chargePc < 0 || inletMicroA < 0 || lifetimeMicroS <= 0)
    throw Error('Charge, inlet, and lifetime must be physical.');
  const recombinationMicroA = chargePc / lifetimeMicroS;
  return {
    inletMicroA,
    recombinationMicroA,
    netMicroA: inletMicroA - recombinationMicroA,
    steadyChargePc: inletMicroA * lifetimeMicroS,
  };
}
