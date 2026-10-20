'use client';

import { useState } from 'react';
import { Controls, Toggle } from './Controls';
import { Calculation, DemoLayout, Info, Metric, Metrics, fmt, sci, texSci, useParams } from './Demos';
import * as P from '../lib/physics';

const blue = '#2672d9';
const orange = '#d56138';
const purple = '#7654ba';
const W = 1120, H = 370, top = 45, bottom = 326;
const conductionY = 160, valenceY = 211;

type Point = [number, number];
const path = (points: Point[]) => points.map(([x, y], index) => (index ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)).join(' ');

export function HoleDistributionDemo() {
  const { v, set, reset } = useParams({ dopant: 1e16, T: 300 });
  const [type, setType] = useState<'n' | 'p'>('n');
  const [relative, setRelative] = useState(false);
  const [hoverEnergy, setHoverEnergy] = useState<number | null>(null);
  const base = P.dopedFermi(type, v.dopant, v.T);
  const Ef = base.Ef, Ec = base.Ec, Ev = base.Ev;
  const Vt = P.thermalVoltage(v.T);
  const span = Math.max(.38, 14 * Vt);
  const minEnergy = Ev - span, maxEnergy = Ec + span;
  // The band gap is compressed; the two band windows remain linear in energy.
  const Y = (energy: number) => energy >= Ec ? conductionY - (energy - Ec) / span * (conductionY - top)
    : energy <= Ev ? valenceY + (Ev - energy) / span * (bottom - valenceY)
      : conductionY + (Ec - energy) / (Ec - Ev) * (valenceY - conductionY);
  const energyAtY = (y: number) => y <= conductionY ? Ec + (conductionY - y) / (conductionY - top) * span
    : y >= valenceY ? Ev - (y - valenceY) / (bottom - valenceY) * span
      : Ec - (y - conductionY) / (valenceY - conductionY) * (Ec - Ev);
  const offsets = Array.from({ length: 161 }, (_, index) => span * index / 160);
  const holes = offsets.map(offset => P.carrierSpectrum('p', offset, Ef, v.T));
  const electrons = offsets.map(offset => P.carrierSpectrum('n', offset, Ef, v.T));
  const maxHole = Math.max(...holes.map(point => point.occupiedStates));
  const maxElectron = Math.max(...electrons.map(point => point.occupiedStates));
  const sharedMax = Math.max(maxHole, maxElectron);
  const maxValenceStates = holes[holes.length - 1].states;
  const maxConductionStates = electrons[electrons.length - 1].states;
  const peakIndex = holes.reduce((best, point, index) => point.occupiedStates > holes[best].occupiedStates ? index : best, 0);
  const electronPeakIndex = electrons.reduce((best, point, index) => point.occupiedStates > electrons[best].occupiedStates ? index : best, 0);
  const fermiY = Y(Ef);
  const fermiLabelY = Math.abs(fermiY - conductionY) < 18 ? fermiY + 18 : Math.abs(fermiY - valenceY) < 18 ? fermiY - 22 : fermiY - 9;
  const holeCurve: Point[] = offsets.map((offset, index) => [815 + 194 * holes[index].occupiedStates / (relative ? sharedMax : maxHole), Y(Ev - offset)]);
  const electronCurve: Point[] = offsets.map((offset, index) => [815 + 194 * electrons[index].occupiedStates / (relative ? sharedMax : maxElectron), Y(Ec + offset)]);
  const holeArea = path([[815, valenceY], ...holeCurve, [815, bottom]]);
  const electronArea = path([[815, conductionY], ...electronCurve, [815, top]]);
  const holeAtHover = hoverEnergy !== null && hoverEnergy <= Ev ? P.carrierSpectrum('p', Ev - hoverEnergy, Ef, v.T) : null;
  const electronAtHover = hoverEnergy !== null && hoverEnergy >= Ec ? P.carrierSpectrum('n', hoverEnergy - Ec, Ef, v.T) : null;
  const inspect = holeAtHover
    ? 'E ' + fmt(hoverEnergy!, 3) + ' eV · gᵥ ' + sci(holeAtHover.states) + ' · 1−f ' + fmt(holeAtHover.occupation, 4) + ' · p(E) ' + sci(holeAtHover.occupiedStates) + ' cm⁻³/eV'
    : electronAtHover
      ? 'E ' + fmt(hoverEnergy!, 3) + ' eV · g꜀ ' + sci(electronAtHover.states) + ' · f ' + fmt(electronAtHover.occupation, 4) + ' · n(E) ' + sci(electronAtHover.occupiedStates) + ' cm⁻³/eV'
      : hoverEnergy === null ? 'Hover over the figure to inspect an energy' : 'No allowed band states in the gap';
  return <DemoLayout calculation={<Calculation
    formula={'\\begin{aligned}n&=\\int_{E_C}^{\\infty}g_C(E)f(E)\\,dE\\\\p&=\\int_{-\\infty}^{E_V}g_V(E)[1-f(E)]\\,dE\\end{aligned}'}
    substitution={'\\begin{aligned}n&=(' + texSci(P.Nc(v.T)) + ')F_{1/2}(' + fmt((Ef - Ec) / Vt, 2) + ')=' + texSci(base.n0) + '\\,\\mathrm{cm^{-3}}\\\\p&=(' + texSci(P.Nv(v.T)) + ')F_{1/2}(' + fmt((Ev - Ef) / Vt, 2) + ')=' + texSci(base.p0) + '\\,\\mathrm{cm^{-3}}\\end{aligned}'} />}
    controls={<Controls values={v} set={set} reset={() => { reset(); setType('n'); setRelative(false); }} items={[
      { key: 'dopant', label: type === 'n' ? 'Donor concentration Nᴅ' : 'Acceptor concentration Nₐ', min: 1e14, max: 1e19, step: 1e13, unit: 'cm⁻³', log: true },
      { key: 'T', label: 'Temperature', min: 200, max: 450, step: 1, unit: 'K' },
    ]}>
      <div className="chips" role="group" aria-label="Doping type">
        <button className={type === 'n' ? 'active' : ''} onClick={() => setType('n')}>N-type donors</button>
        <button className={type === 'p' ? 'active' : ''} onClick={() => setType('p')}>P-type acceptors</button>
      </div>
      <Toggle label="Compare electron and hole amounts on one scale" checked={relative} onChange={setRelative} />
    </Controls>}>
    <Metrics>
      <Metric label="Electrons n" value={sci(base.n0)} unit="cm⁻³" />
      <Metric label="Holes p" value={sci(base.p0)} unit="cm⁻³" />
      <Metric label="Fermi level Eꜰ" value={fmt(Ef, 3)} unit="eV from Eᵢ" />
      <Metric label={type === 'n' ? 'Eᴄ − Eꜰ' : 'Eꜰ − Eᴠ'} value={fmt(type === 'n' ? Ec - Ef : Ef - Ev, 3)} unit="eV" />
    </Metrics>
    {v.dopant >= 3e18 && <div className="notice">At very high doping, this ideal-band model omits bandgap narrowing and dopant-ionization effects.</div>}
    <div className="plot-card spectrum-card">
      <div className="plot-title"><b>Electron and hole energy distributions</b><span>Blue: electrons · Orange: holes</span></div>
      <div className="spectrum-scroll">
        <svg viewBox={'0 0 ' + W + ' ' + H} role="img" aria-label="Energy bands, density of states, electron and hole occupation, and carrier energy distributions"
          onMouseMove={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            const energy = energyAtY((event.clientY - rect.top) * H / rect.height);
            setHoverEnergy(Math.max(minEnergy, Math.min(maxEnergy, energy)));
          }} onMouseLeave={() => setHoverEnergy(null)}>
          <text x="48" y="24" className="spectrum-heading">Energy bands</text>
          <text x="295" y="24" className="spectrum-heading">Available states</text>
          <text x="510" y="25" className="spectrum-operator">×</text>
          <text x="545" y="24" className="spectrum-heading">Occupation</text>
          <text x="781" y="25" className="spectrum-operator">=</text>
          <text x="807" y="24" className="spectrum-heading">Carrier distribution</text>
          {[250, 510, 780].map(x => <line key={x} x1={x} x2={x} y1="38" y2="338" stroke="#e5ecef" />)}
          <line x1="43" x2="1054" y1={conductionY} y2={conductionY} stroke="#dce8f4" strokeDasharray="4 5" />
          <line x1="43" x2="1054" y1={valenceY} y2={valenceY} stroke="#f4e0d6" strokeDasharray="4 5" />
          <line x1="43" x2="1054" y1={fermiY} y2={fermiY} stroke={purple} strokeWidth="1.5" strokeDasharray="5 5" opacity=".75" />
          <line x1="53" x2="53" y1={top} y2={bottom} stroke="#a5b2ba" />
          <path d="M48 55 L53 45 L58 55" fill="none" stroke="#a5b2ba" />
          <text x="47" y="357" className="spectrum-axis">Energy E ↑</text>
          <text x="323" y="191" className="spectrum-axis">gap compressed</text>
          <line x1="82" x2="207" y1={conductionY} y2={conductionY} stroke={blue} strokeWidth="3" />
          <line x1="82" x2="207" y1={valenceY} y2={valenceY} stroke={orange} strokeWidth="3" />
          <text x="88" y={conductionY - 9} fill={blue} className="spectrum-label">E꜀ {fmt(Ec, 3)} eV</text>
          <text x="88" y={valenceY + 22} fill={orange} className="spectrum-label">Eᵥ {fmt(Ev, 3)} eV</text>
          <text x="88" y={fermiLabelY} fill={purple} className="spectrum-label">Eꜰ {fmt(Ef, 3)} eV</text>
          <line x1="300" x2="300" y1={top} y2={bottom} stroke="#a5b2ba" />
          <path d={path(offsets.map((offset, index) => [300 + 160 * electrons[index].states / maxConductionStates, Y(Ec + offset)]))} fill="none" stroke={blue} strokeWidth="2.5" />
          <path d={path(offsets.map((offset, index) => [300 + 160 * holes[index].states / maxValenceStates, Y(Ev - offset)]))} fill="none" stroke={orange} strokeWidth="2.5" />
          <text x="312" y={conductionY - 11} fill={blue} className="spectrum-label">g꜀(E)</text>
          <text x="312" y={valenceY + 23} fill={orange} className="spectrum-label">gᵥ(E)</text>
          <line x1="550" x2="550" y1={top} y2={bottom} stroke="#a5b2ba" />
          <path d={path(Array.from({ length: 221 }, (_, index) => {
            const energy = minEnergy + (maxEnergy - minEnergy) * index / 220;
            const occupied = 1 / (1 + Math.exp((energy - Ef) / Vt));
            return [550 + 165 * occupied, Y(energy)];
          }))} fill="none" stroke={blue} strokeWidth="2.5" />
          <path d={path(Array.from({ length: 221 }, (_, index) => {
            const energy = minEnergy + (maxEnergy - minEnergy) * index / 220;
            const empty = 1 / (1 + Math.exp((Ef - energy) / Vt));
            return [550 + 165 * empty, Y(energy)];
          }))} fill="none" stroke={orange} strokeWidth="2.5" />
          <text x="562" y={conductionY - 12} fill={blue} className="spectrum-label">f(E)</text>
          <text x="562" y={valenceY + 23} fill={orange} className="spectrum-label">1 − f(E)</text>
          <text x="562" y={bottom + 22} className="spectrum-axis">0 → 1</text>
          <line x1="815" x2="815" y1={top} y2={bottom} stroke="#a5b2ba" />
          <path d={electronArea} fill={blue} opacity=".15" />
          <path d={holeArea} fill={orange} opacity=".22" />
          <path d={path(electronCurve)} fill="none" stroke={blue} strokeWidth="2.5" />
          <path d={path(holeCurve)} fill="none" stroke={orange} strokeWidth="3" />
          <text x="821" y={conductionY - 11} fill={blue} className="spectrum-label">n(E) = g꜀ f</text>
          <text x="821" y={valenceY + 23} fill={orange} className="spectrum-label">p(E) = gᵥ(1 − f)</text>
          <circle cx={holeCurve[peakIndex][0]} cy={holeCurve[peakIndex][1]} r="4" fill={orange} stroke="white" strokeWidth="1.5" />
          <circle cx={electronCurve[electronPeakIndex][0]} cy={electronCurve[electronPeakIndex][1]} r="4" fill={blue} stroke="white" strokeWidth="1.5" />
          {hoverEnergy !== null && <line x1="280" x2="1045" y1={Y(hoverEnergy)} y2={Y(hoverEnergy)} stroke="#75828c" strokeDasharray="3 4" />}
        </svg>
      </div>
      <div className="plot-footer"><span className="spectrum-footnote">{relative ? 'Carrier spectra use one shared scale; minority carriers may be hard to see.' : 'Each carrier spectrum is scaled to its own peak so both shapes are visible.'} Band gap compressed on the energy axis.</span><span className="inspect">{inspect}</span></div>
    </div>
    <Info intuition="Allowed conduction-band states become electrons and empty valence-band states become holes. Doping moves the equilibrium Fermi level; temperature broadens the occupation transition." model="The electron spectrum is g꜀(E)f(E), and the hole spectrum is gᵥ(E)[1−f(E)]. Their energy integrals give n and p using Fermi–Dirac statistics." takeaway="More donors move Eꜰ toward E꜀ and favor electrons; more acceptors move Eꜰ toward Eᵥ and favor holes." derivation={[
      'n(E)=g_C(E)f(E),\\qquad p(E)=g_V(E)[1-f(E)]',
      'f(E)=\\frac{1}{1+e^{(E-E_F)/kT}}',
      'n=\\int_{E_C}^{\\infty}n(E)\\,dE=N_CF_{1/2}((E_F-E_C)/kT)',
      'p=\\int_{-\\infty}^{E_V}p(E)\\,dE=N_VF_{1/2}((E_V-E_F)/kT)',
    ]} />
  </DemoLayout>;
}
