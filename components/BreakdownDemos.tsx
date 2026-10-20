'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Controls, Toggle } from './Controls';
import { Calculation, DemoLayout, Info, Metric, Metrics, fmt, pts, sci, texSci, useParams } from './Demos';
import Plot from './Plot';
import { AvalancheAnimation, ZenerAnimation } from './BreakdownAnimations';
import { avalancheModel, zenerModel } from '../lib/breakdown';

const blue = '#2672d9', orange = '#d56138', purple = '#7654ba';
const speedControl = { key: 'speed', label: 'Animation speed', min: .25, max: 2, step: .25, unit: '×' };

export function AvalancheBreakdown() {
  const { v, set, reset } = useParams({ voltage: 45, width: 1.5, speed: 1 });
  const [automatic, setAutomatic] = useState(true);
  const [logGain, setLogGain] = useState(false);
  const [replay, setReplay] = useState(0);
  const model = avalancheModel(v.voltage, v.width);
  const gainY = (voltage: number) => {
    const state = avalancheModel(voltage, v.width);
    return logGain ? state.opticalDepth / Math.LN10 : state.gain;
  };
  const maxGain = gainY(60);
  const fieldMax = Math.max(6e5, model.field * 1.1);
  const alphaAt = (field: number) => avalancheModel(field * model.widthCm, v.width).alpha;
  const resetAll = () => { reset(); setAutomatic(true); setLogGain(false); setReplay(value => value + 1); };
  return <DemoLayout controls={<Controls values={v} set={set} reset={resetAll} items={[
    { key: 'voltage', label: 'Reverse voltage magnitude', min: 0, max: 60, step: .5, unit: 'V' },
    { key: 'width', label: 'Depleted region width', min: .5, max: 3, step: .05, unit: 'µm' },
    speedControl,
  ]}>
    <Toggle label="Automatic seed electrons" checked={automatic} onChange={setAutomatic} />
    <Toggle label="Log multiplication axis" checked={logGain} onChange={setLogGain} />
  </Controls>} calculation={<Calculation title="Avalanche: local-field multiplication model" forms={[
    { label: 'Field across the chosen region', formula: String.raw`|\mathcal E|=\frac{V_R}{W}` },
    { label: 'Impact-ionization coefficient', formula: String.raw`\alpha_n=A_n e^{-B_n/|\mathcal E|},\quad A_n=7.03\times10^5\,\mathrm{cm^{-1}},\quad B_n=1.231\times10^6\,\mathrm{V/cm}` },
    { label: 'Single-pass electron multiplication', formula: String.raw`\frac{dN_e}{dx}=\alpha_nN_e,\qquad M_e=\frac{N_e(W)}{N_e(0)}=e^{\alpha_nW}` },
    { label: 'Probability of an ionizing event', formula: String.raw`P_{\mathrm{impact}}(\Delta x)=1-e^{-\alpha_n\Delta x}` },
  ]} substitution={String.raw`|\mathcal E|=\frac{${fmt(v.voltage, 1)}}{${texSci(model.widthCm)}}=${texSci(model.field)}\,\mathrm{V/cm},\qquad M_e=e^{${fmt(model.opticalDepth, 3)}}=${texSci(model.gain)}`} />}>
    <Metrics>
      <Metric label="Electric field magnitude" value={sci(model.field)} unit="V/cm" />
      <Metric label="Ionization coefficient αₙ" value={sci(model.alpha)} unit="cm⁻¹" />
      <Metric label="Mean electrons per seed" value={model.gain < 100 ? fmt(model.gain, 2) : sci(model.gain)} />
      <Metric label="At least one seed impact" value={fmt(model.ionizationProbability * 100, 1)} unit="%" />
    </Metrics>
    <AvalancheAnimation key={replay} model={model} speed={v.speed} automatic={automatic} />
    <div className="graph-grid breakdown-graphs">
      <Plot title="Electron multiplication vs reverse voltage" xLabel="Reverse voltage magnitude (V)"
        yLabel={logGain ? 'log₁₀ Mₑ' : 'Mₑ (electrons per seed)'} xDomain={[0, 60]}
        yDomain={[0, maxGain * 1.1]}
        series={[{ name: 'Single-pass electron gain', color: blue, points: pts(0, 60, 180, gainY) }]}
        markers={[{ x: v.voltage, label: 'Selected ' + fmt(v.voltage, 1) + ' V' }]}
        points={[{ x: v.voltage, y: gainY(v.voltage), label: 'Mₑ ' + (model.gain < 100 ? fmt(model.gain, 2) : sci(model.gain)), color: blue }]}
        onInspect={voltage => 'Mean electrons per seed ' + sci(avalancheModel(voltage, v.width).gain)} />
      <Plot title="Field creates ionizing collisions" xLabel="Electric field magnitude (V/cm)" yLabel="αₙ (cm⁻¹)"
        xDomain={[0, fieldMax]} yDomain={[0, alphaAt(fieldMax) * 1.12]}
        series={[{ name: 'Electron ionization coefficient', color: orange, points: pts(0, fieldMax, 180, alphaAt) }]}
        markers={[{ x: model.field, label: 'Selected field' }]}
        points={[{ x: model.field, y: model.alpha, label: 'αₙ ' + sci(model.alpha) + ' cm⁻¹', color: orange }]}
        onInspect={field => 'αₙ ' + sci(alphaAt(field)) + ' cm⁻¹'} />
    </div>
    <Info intuition="The reverse field accelerates an existing electron. An ionizing collision excites a valence electron into the conduction band, leaving a hole. Both electrons can repeat the process while holes drift in the opposite direction."
      model="A uniform, prescribed field uses a 300 K silicon electron-ionization fit. The mean gain is a single-pass, electron-only branching model. Hole-triggered ionization, phonon energy losses, space-charge screening, circuit current limits, and heating are omitted; this model does not predict a self-sustaining breakdown voltage."
      takeaway="Raise the voltage to increase the field and the collision probability. Inject one seed with the automatic source off to follow one cascade." derivation={[]} />
    <p className="breakdown-reference">Model reference: <a href="https://www.iue.tuwien.ac.at/phd/park/node33.html" target="_blank" rel="noreferrer">TU Wien · impact ionization</a>. The coefficient fit is an illustration of the mechanism, including outside its calibrated field range. <Link href="/zener-breakdown">Compare with Zener tunneling →</Link></p>
  </DemoLayout>;
}

export function ZenerBreakdown() {
  const { v, set, reset } = useParams({ voltage: 6, width: 8, speed: 1 });
  const [repeat, setRepeat] = useState(true);
  const [logTransmission, setLogTransmission] = useState(false);
  const [replay, setReplay] = useState(0);
  const model = zenerModel(v.voltage, v.width);
  const probabilityY = (voltage: number) => {
    const state = zenerModel(voltage, v.width);
    return logTransmission ? -state.action / Math.LN10 : state.transmission * 100;
  };
  const minProbabilityVoltage = logTransmission ? model.bandgap : 0;
  const minY = logTransmission ? probabilityY(model.bandgap) : 0;
  const maxY = probabilityY(8);
  const padding = (maxY - minY) * .1;
  const resetAll = () => { reset(); setRepeat(true); setLogTransmission(false); setReplay(value => value + 1); };
  return <DemoLayout controls={<Controls values={v} set={set} reset={resetAll} items={[
    { key: 'voltage', label: 'Voltage drop across junction', min: 0, max: 8, step: .05, unit: 'V' },
    { key: 'width', label: 'Narrow junction width', min: 5, max: 40, step: .5, unit: 'nm' },
    speedControl,
  ]}>
    <Toggle label="Repeat wave packets" checked={repeat} onChange={setRepeat} />
    <Toggle label="Log transmission axis" checked={logTransmission} onChange={setLogTransmission} />
  </Controls>} calculation={<Calculation title="Zener: triangular-barrier WKB model" forms={[
    { label: 'Field and forbidden distance', formula: String.raw`|\mathcal E|=\frac{V_{\mathrm{drop}}}{W},\qquad \ell_{\mathrm{tun}}=\frac{E_g}{q|\mathcal E|}` },
    { label: 'Transmission estimate', formula: String.raw`T\approx\exp\!\left[-\frac{4\sqrt{2m_r}\,E_g^{3/2}}{3q\hbar|\mathcal E|}\right],\qquad m_r=0.08m_0` },
    { label: 'Wave decay in the gap', formula: String.raw`|\psi(x)|\propto e^{-\int_0^x\kappa(x')dx'},\qquad\kappa=\frac{\sqrt{2m_r[U(x)-E]}}{\hbar}` },
    { label: 'Available final state', formula: String.raw`qV_{\mathrm{drop}}\geq E_g,\qquad E_g=1.12\,\mathrm{eV},\qquad E=0` },
  ]} substitution={model.channelOpen
    ? String.raw`|\mathcal E|=${texSci(model.field)}\,\mathrm{V/cm},\quad\ell_{\mathrm{tun}}=${fmt(model.tunnelDistanceNm, 3)}\,\mathrm{nm},\quad T=e^{-${fmt(model.action, 3)}}=${texSci(model.transmission)}`
    : String.raw`V_{\mathrm{drop}}=${fmt(v.voltage, 2)}\,\mathrm V< E_g/q:\quad\text{no final conduction state at the chosen energy},\quad T=0`} />}>
    <Metrics>
      <Metric label="Electric field magnitude" value={sci(model.field)} unit="V/cm" />
      <Metric label="Tunnel distance" value={Number.isFinite(model.tunnelDistanceNm) ? fmt(model.tunnelDistanceNm, 2) : '∞'} unit="nm" />
      <Metric label="Transmission probability" value={model.transmission > 0 && model.transmission < 1e-4 ? sci(model.transmission * 100) : fmt(model.transmission * 100, 3)} unit="%" />
      <Metric label="Reflected probability" value={fmt(model.reflection * 100, 2)} unit="%" />
    </Metrics>
    <ZenerAnimation key={replay} model={model} speed={v.speed} repeat={repeat} />
    <div className="graph-grid breakdown-graphs">
      <Plot title="Tunneling probability vs voltage" xLabel="Voltage drop across junction (V)"
        yLabel={logTransmission ? 'log₁₀ T' : 'Transmission (%)'} xDomain={[0, 8]}
        yDomain={[logTransmission ? minY - padding : 0, maxY + padding]}
        zones={[{ from: 0, to: model.bandgap, color: '#97a3b3' }]}
        series={[{ name: 'Triangular-barrier WKB', color: purple, points: pts(minProbabilityVoltage, 8, 180, probabilityY) }]}
        markers={[{ x: v.voltage, label: 'Selected drop ' + fmt(v.voltage, 2) + ' V' }]}
        points={logTransmission && !model.channelOpen ? [] : [{ x: v.voltage, y: probabilityY(v.voltage), label: 'T ' + sci(model.transmission * 100) + '%', color: purple }]}
        onInspect={voltage => { const state = zenerModel(voltage, v.width); return state.channelOpen ? 'T ' + sci(state.transmission * 100) + '%' : 'No available final state at this energy'; }} />
      <Plot title="Band edges across the narrow junction" xLabel="Position (nm)" yLabel="Energy (eV)"
        xDomain={[0, v.width]} yDomain={[-v.voltage - .2, model.bandgap + .2]}
        series={[
          { name: 'Conduction band Eᴄ', color: blue, points: [[0, model.bandgap], [v.width, model.bandgap - v.voltage]] },
          { name: 'Valence band Eᵥ', color: '#14875f', points: [[0, 0], [v.width, -v.voltage]] },
          { name: 'Electron energy', color: purple, points: [[0, 0], [v.width, 0]], dash: true },
        ]}
        points={model.channelOpen ? [{ x: model.tunnelDistanceNm, y: 0, label: 'Turning point ' + fmt(model.tunnelDistanceNm, 2) + ' nm', color: purple }] : []}
        onInspect={position => 'Eᴄ ' + fmt(model.bandgap - v.voltage * position / v.width) + ' eV · Eᵥ ' + fmt(-v.voltage * position / v.width) + ' eV'} />
    </div>
    <Info intuition="A strong field tilts the band edges across a narrow junction. An occupied valence-band state can connect through a forbidden gap to an empty conduction-band state at the same energy."
      model="This uses a uniform prescribed junction voltage drop, a 1.12 eV gap and an illustrative reduced tunneling mass of 0.08m₀. WKB estimates the triangular-barrier exponential and omits detailed band structure, phonon assistance, occupation integrals, and a self-consistent contact or doping solution."
      takeaway="Increase voltage or reduce the width to strengthen the field, shorten the forbidden distance, and increase the transmitted wave." derivation={[]} />
    <p className="breakdown-reference">Model reference: <a href="https://ocw.mit.edu/courses/6-728-applied-quantum-and-statistical-physics-fall-2006/ae3ea48a204561909689dcff7c43ffaf_wkb_tunneling2.pdf" target="_blank" rel="noreferrer">MIT OpenCourseWare · WKB tunneling</a>. <Link href="/avalanche-breakdown">Compare with impact ionization →</Link></p>
  </DemoLayout>;
}
