'use client';

import { useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, Info, Metric, Metrics, fmt, sci, texSci, useParams } from './Demos';
import * as P from '../lib/physics';

const blue = '#2672d9';
const orange = '#d56138';
const purple = '#7654ba';
const W = 1120, H = 420, top = 48, bottom = 380;

type Point = [number, number];
const path = (points: Point[]) => points.map(([x, y], index) => (index ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)).join(' ');

export function HoleDistributionDemo() {
  const { v, set, reset } = useParams({ EF: 0, T: 300 });
  const [hoverEnergy, setHoverEnergy] = useState<number | null>(null);
  const densities = P.carrierDensitiesFromFermi(v.EF, v.T);
  const Vt = P.thermalVoltage(v.T);
  const span = Math.max(.28, 10 * Vt);
  const minEnergy = densities.Ev - span, maxEnergy = densities.Ec + span;
  const Y = (energy: number) => top + (maxEnergy - energy) / (maxEnergy - minEnergy) * (bottom - top);
  const energyAtY = (y: number) => maxEnergy - (y - top) / (bottom - top) * (maxEnergy - minEnergy);
  const offsets = Array.from({ length: 161 }, (_, index) => span * index / 160);
  const holes = offsets.map(offset => P.carrierSpectrum('p', offset, v.EF, v.T));
  const electrons = offsets.map(offset => P.carrierSpectrum('n', offset, v.EF, v.T));
  const maxHole = Math.max(...holes.map(point => point.occupiedStates));
  const maxElectron = Math.max(...electrons.map(point => point.occupiedStates));
  const maxValenceStates = holes[holes.length - 1].states;
  const maxConductionStates = electrons[electrons.length - 1].states;
  const peakIndex = holes.reduce((best, point, index) => point.occupiedStates > holes[best].occupiedStates ? index : best, 0);
  const peakOffset = offsets[peakIndex];
  const valenceY = Y(densities.Ev), conductionY = Y(densities.Ec);
  const fermiY = Y(v.EF);
  const fermiLabelY = Math.abs(fermiY - conductionY) < 18 ? fermiY + 18 : Math.abs(fermiY - valenceY) < 18 ? fermiY - 22 : fermiY - 9;
  const holeCurve: Point[] = offsets.map((offset, index) => [815 + 194 * holes[index].occupiedStates / maxHole, Y(densities.Ev - offset)]);
  const electronCurve: Point[] = offsets.map((offset, index) => [815 + 194 * electrons[index].occupiedStates / maxElectron, Y(densities.Ec + offset)]);
  const holeArea = path([[815, valenceY], ...holeCurve, [815, Y(densities.Ev - span)]]);
  const electronArea = path([[815, conductionY], ...electronCurve, [815, Y(densities.Ec + span)]]);
  const holeAtHover = hoverEnergy !== null && hoverEnergy <= densities.Ev ? P.carrierSpectrum('p', densities.Ev - hoverEnergy, v.EF, v.T) : null;
  const electronAtHover = hoverEnergy !== null && hoverEnergy >= densities.Ec ? P.carrierSpectrum('n', hoverEnergy - densities.Ec, v.EF, v.T) : null;
  const inspect = holeAtHover
    ? 'E ' + fmt(hoverEnergy!, 3) + ' eV · gᵥ ' + sci(holeAtHover.states) + ' · 1−f ' + fmt(holeAtHover.occupation, 4) + ' · p(E) ' + sci(holeAtHover.occupiedStates) + ' cm⁻³/eV'
    : electronAtHover
      ? 'E ' + fmt(hoverEnergy!, 3) + ' eV · n(E) ' + sci(electronAtHover.occupiedStates) + ' cm⁻³/eV'
      : hoverEnergy === null ? 'Hover over the figure to inspect an energy' : 'No allowed band states in the gap';
  return <DemoLayout calculation={<Calculation
    formula={'p(E)=g_V(E)[1-f(E)],\\qquad p=\\int_{-\\infty}^{E_V}p(E)\\,dE'}
    substitution={'p=(' + texSci(P.Nv(v.T)) + ')F_{1/2}(' + fmt(densities.holeEta, 2) + ')=' + texSci(densities.p) + '\\,\\mathrm{cm^{-3}}'} />}
    controls={<Controls values={v} set={set} reset={reset} items={[
      { key: 'EF', label: 'Fermi level Eꜰ − Eᵢ', min: -.7, max: .7, step: .005, unit: 'eV' },
      { key: 'T', label: 'Temperature', min: 200, max: 450, step: 1, unit: 'K' },
    ]} />}>
    <Metrics>
      <Metric label="Total holes p" value={sci(densities.p)} unit="cm⁻³" />
      <Metric label="Total electrons n" value={sci(densities.n)} unit="cm⁻³" />
      <Metric label="Hole peak below Eᵥ" value={fmt(peakOffset * 1000, 1)} unit="meV" />
      <Metric label="kT / 2 limit" value={fmt(Vt * 500, 1)} unit="meV" />
    </Metrics>
    <div className="plot-card spectrum-card">
      <div className="plot-title"><b>Energy-resolved carriers</b><span>Four views share the same energy axis</span></div>
      <div className="spectrum-scroll">
        <svg viewBox={'0 0 ' + W + ' ' + H} role="img" aria-label="Energy bands, density of states, hole occupation probability, and carrier energy distribution"
          onMouseMove={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            const energy = energyAtY((event.clientY - rect.top) * H / rect.height);
            setHoverEnergy(Math.max(minEnergy, Math.min(maxEnergy, energy)));
          }} onMouseLeave={() => setHoverEnergy(null)}>
          <text x="48" y="24" className="spectrum-heading">Energy bands</text>
          <text x="295" y="24" className="spectrum-heading">Available states</text>
          <text x="510" y="25" className="spectrum-operator">×</text>
          <text x="545" y="24" className="spectrum-heading">Empty probability</text>
          <text x="781" y="25" className="spectrum-operator">=</text>
          <text x="807" y="24" className="spectrum-heading">Carrier distribution</text>
          {[250, 510, 780].map(x => <line key={x} x1={x} x2={x} y1="38" y2="390" stroke="#e5ecef" />)}
          <line x1="43" x2="1054" y1={conductionY} y2={conductionY} stroke="#dce8f4" strokeDasharray="4 5" />
          <line x1="43" x2="1054" y1={valenceY} y2={valenceY} stroke="#f4e0d6" strokeDasharray="4 5" />
          <line x1="43" x2="1054" y1={fermiY} y2={fermiY} stroke={purple} strokeWidth="1.5" strokeDasharray="5 5" opacity=".75" />
          <line x1="53" x2="53" y1={top} y2={bottom} stroke="#a5b2ba" />
          <path d="M48 55 L53 45 L58 55" fill="none" stroke="#a5b2ba" />
          <text x="47" y="407" className="spectrum-axis">Energy E ↑</text>
          <line x1="82" x2="207" y1={conductionY} y2={conductionY} stroke={blue} strokeWidth="3" />
          <line x1="82" x2="207" y1={valenceY} y2={valenceY} stroke={orange} strokeWidth="3" />
          <text x="88" y={conductionY - 9} fill={blue} className="spectrum-label">E꜀ {fmt(densities.Ec, 3)} eV</text>
          <text x="88" y={valenceY - 9} fill={orange} className="spectrum-label">Eᵥ {fmt(densities.Ev, 3)} eV</text>
          <text x="88" y={fermiLabelY} fill={purple} className="spectrum-label">Eꜰ {fmt(v.EF, 3)} eV</text>
          <line x1="300" x2="300" y1={top} y2={bottom} stroke="#a5b2ba" />
          <path d={path(offsets.map((offset, index) => [300 + 160 * electrons[index].states / maxConductionStates, Y(densities.Ec + offset)]))} fill="none" stroke={blue} strokeWidth="2.5" />
          <path d={path(offsets.map((offset, index) => [300 + 160 * holes[index].states / maxValenceStates, Y(densities.Ev - offset)]))} fill="none" stroke={orange} strokeWidth="2.5" />
          <text x="312" y={conductionY - 11} fill={blue} className="spectrum-label">g꜀(E)</text>
          <text x="312" y={valenceY + 23} fill={orange} className="spectrum-label">gᵥ(E)</text>
          <line x1="550" x2="550" y1={top} y2={bottom} stroke="#a5b2ba" />
          <path d={path(Array.from({ length: 221 }, (_, index) => {
            const energy = minEnergy + (maxEnergy - minEnergy) * index / 220;
            const empty = 1 / (1 + Math.exp((v.EF - energy) / Vt));
            return [550 + 165 * empty, Y(energy)];
          }))} fill="none" stroke={purple} strokeWidth="3" />
          <text x="562" y={conductionY - 12} fill={purple} className="spectrum-label">1 − f(E)</text>
          <text x="562" y={bottom + 22} className="spectrum-axis">0 → 1</text>
          <line x1="815" x2="815" y1={top} y2={bottom} stroke="#a5b2ba" />
          <path d={electronArea} fill={blue} opacity=".15" />
          <path d={holeArea} fill={orange} opacity=".22" />
          <path d={path(electronCurve)} fill="none" stroke={blue} strokeWidth="2.5" />
          <path d={path(holeCurve)} fill="none" stroke={orange} strokeWidth="3" />
          <text x="821" y={conductionY - 11} fill={blue} className="spectrum-label">n(E) = g꜀ f</text>
          <text x="821" y={valenceY + 23} fill={orange} className="spectrum-label">p(E) = gᵥ(1 − f)</text>
          <circle cx={holeCurve[peakIndex][0]} cy={holeCurve[peakIndex][1]} r="4" fill={orange} stroke="white" strokeWidth="1.5" />
          {hoverEnergy !== null && <line x1="280" x2="1045" y1={Y(hoverEnergy)} y2={Y(hoverEnergy)} stroke="#75828c" strokeDasharray="3 4" />}
        </svg>
      </div>
      <div className="plot-footer"><span className="spectrum-footnote">Shapes are normalized separately; totals use the unscaled integrals.</span><span className="inspect">{inspect}</span></div>
    </div>
    <Info intuition="Each energy in an allowed band has a number of available states. A hole is an unoccupied valence-band state, so multiply the valence density of states by 1−f(E). The shaded distribution contains all holes across valence-band energies." model="For a parabolic valence band, gᵥ(E) grows as √(Eᵥ−E). The vacancy probability rises toward the band edge. Their product gives the hole spectrum p(E), whose integral is the total hole concentration." takeaway="The hole distribution is largest slightly below Eᵥ. In the nondegenerate limit, its peak is kT/2 below Eᵥ; the exact peak changes when the Fermi level enters the band." derivation={[
      'g_V(E)=\\frac{2N_V}{\\sqrt\\pi(kT)^{3/2}}\\sqrt{E_V-E}',
      '1-f(E)=\\frac{1}{1+e^{(E_F-E)/kT}}',
      'p(E)=g_V(E)[1-f(E)]',
      'p=\\int_{-\\infty}^{E_V}p(E)\\,dE=N_VF_{1/2}((E_V-E_F)/kT)',
    ]} />
  </DemoLayout>;
}
