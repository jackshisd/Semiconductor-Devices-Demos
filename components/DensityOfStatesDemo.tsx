'use client';

import { useState } from 'react';
import Plot from './Plot';
import { Controls } from './Controls';
import { Calculation, DemoLayout, Info, Metric, Metrics, fmt, pts, sci, texSci, useParams } from './Demos';
import * as P from '../lib/physics';

const electronColor = '#2672d9';
const holeColor = '#d56138';

export function DensityOfStatesDemo() {
  const { v, set, reset } = useParams({ EF: 0, T: 300 });
  const [carrier, setCarrier] = useState<'n' | 'p'>('n');
  const result = P.carrierDensitiesFromFermi(v.EF, v.T);
  const edge = carrier === 'n' ? result.Ec : result.Ev;
  const eta = carrier === 'n' ? result.electronEta : result.holeEta;
  const density = carrier === 'n' ? result.n : result.p;
  const effectiveDensity = carrier === 'n' ? P.Nc(v.T) : P.Nv(v.T);
  const color = carrier === 'n' ? electronColor : holeColor;
  const energyLimit = Math.max(.32, Math.max(0, eta * P.thermalVoltage(v.T)) + 12 * P.thermalVoltage(v.T));
  const samples = pts(0, energyLimit, 160, energy => energy);
  const spectrum = samples.map(([energy]) => P.carrierSpectrum(carrier, energy, v.EF, v.T));
  const maxStates = Math.max(...spectrum.map(point => point.states));
  const maxProduct = Math.max(...spectrum.map(point => point.occupiedStates));
  const densityScale = 10 ** Math.floor(Math.log10(Math.max(maxProduct, 1)));
  const occupiedCurve: [number, number][] = samples.map(([energy], index) => [energy, spectrum[index].occupiedStates / densityScale]);
  const peakIndex = spectrum.reduce((best, point, index) => point.occupiedStates > spectrum[best].occupiedStates ? index : best, 0);
  const peakEnergy = samples[peakIndex][0];
  const axisEnergy = carrier === 'n' ? 'E − E꜀ (eV)' : 'Eᵥ − E (eV)';
  const symbol = carrier === 'n' ? 'n' : 'p';
  const formula = carrier === 'n'
    ? '\\displaystyle n=\\int_{E_C}^{\\infty}g_C(E)f(E)\\,dE=N_CF_{1/2}\\!\\left(\\frac{E_F-E_C}{kT}\\right)'
    : '\\displaystyle p=\\int_{-\\infty}^{E_V}g_V(E)[1-f(E)]\\,dE=N_VF_{1/2}\\!\\left(\\frac{E_V-E_F}{kT}\\right)';
  const substitution = symbol + '=(' + texSci(effectiveDensity) + ')F_{1/2}(' + fmt(eta, 2) + ')=' + texSci(density) + '\\,\\mathrm{cm^{-3}}';
  return <DemoLayout calculation={<Calculation formula={formula} substitution={substitution} />}
    controls={<Controls values={v} set={set} reset={() => { reset(); setCarrier('n'); }} items={[
      { key: 'EF', label: 'Fermi level Eꜰ − Eᵢ', min: -.7, max: .7, step: .005, unit: 'eV' },
      { key: 'T', label: 'Temperature', min: 200, max: 450, step: 1, unit: 'K' },
    ]}><div className="chips" role="group" aria-label="Carrier type">
      <button className={carrier === 'n' ? 'active' : ''} onClick={() => setCarrier('n')}>Electrons</button>
      <button className={carrier === 'p' ? 'active' : ''} onClick={() => setCarrier('p')}>Holes</button>
    </div></Controls>}>
    <Metrics>
      <Metric label="Electron concentration n" value={sci(result.n)} unit="cm⁻³" />
      <Metric label="Hole concentration p" value={sci(result.p)} unit="cm⁻³" />
      <Metric label="Fermi level Eꜰ − Eᵢ" value={fmt(v.EF, 3)} unit="eV" />
      <Metric label={carrier === 'n' ? 'E꜀ − Eꜰ' : 'Eꜰ − Eᵥ'} value={fmt(carrier === 'n' ? edge - v.EF : v.EF - edge, 3)} unit="eV" />
    </Metrics>
    <div className="graph-grid">
      <Plot title="Available states × occupation" xLabel={axisEnergy} yLabel="DOS normalized; occupation probability" xDomain={[0, energyLimit]} yDomain={[0, 1.07]} series={[
        { name: 'Density of states (normalized)', color: '#8495a3', points: samples.map(([energy], index) => [energy, spectrum[index].states / maxStates]) },
        { name: carrier === 'n' ? 'Electron occupation f(E)' : 'Hole occupation 1−f(E)', color, points: samples.map(([energy], index) => [energy, spectrum[index].occupation]) },
      ]} onInspect={energy => { const point = P.carrierSpectrum(carrier, energy, v.EF, v.T); return 'DOS ' + sci(point.states) + ' cm⁻³/eV · occupation ' + fmt(point.occupation, 4); }} />
      <Plot title={'Occupied states: shaded area = ' + symbol} xLabel={axisEnergy} yLabel={'g × occupation (10^' + Math.floor(Math.log10(densityScale)) + ' cm⁻³/eV)'} xDomain={[0, energyLimit]} yDomain={[0, maxProduct / densityScale * 1.25]} series={[
        { name: carrier === 'n' ? 'g꜀(E) f(E)' : 'gᵥ(E) [1−f(E)]', color, points: occupiedCurve, areaTo: 0 },
      ]} points={[{ x: peakEnergy, y: occupiedCurve[peakIndex][1], label: 'Area = ' + sci(density) + ' cm⁻³', color }]}
      onInspect={energy => 'Occupied DOS ' + sci(P.carrierSpectrum(carrier, energy, v.EF, v.T).occupiedStates) + ' cm⁻³/eV'} />
    </div>
    <Info intuition="The density of states counts available places for carriers at each energy. Fermi–Dirac statistics gives the fraction occupied by electrons or holes. The shaded product adds those occupied states across energy." model="A three-dimensional parabolic-band density of states is proportional to the square root of energy measured from the band edge. Integrating its product with the Fermi occupation gives n; integrating with the hole occupation gives p." takeaway="Moving the Fermi level changes occupation, not the number of available states. The area under the occupied density of states is the carrier concentration." derivation={[
      'g_C(E)=\\frac{2N_C}{\\sqrt\\pi(kT)^{3/2}}\\sqrt{E-E_C}',
      'f(E)=\\frac{1}{1+e^{(E-E_F)/kT}}',
      'n=\\int_{E_C}^{\\infty}g_C(E)f(E)\\,dE=N_CF_{1/2}((E_F-E_C)/kT)',
      'p=\\int_{-\\infty}^{E_V}g_V(E)[1-f(E)]\\,dE=N_VF_{1/2}((E_V-E_F)/kT)',
    ]} />
  </DemoLayout>;
}
