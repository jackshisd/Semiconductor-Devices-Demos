'use client';

import { useState } from 'react';
import Link from 'next/link';
import Plot from './Plot';
import ContinuityDiagram from './ContinuityDiagram';
import { Controls, Toggle, type Control } from './Controls';
import { Calculation, DemoLayout, Info, Metric, Metrics, fmt, pts, sci, texSci, useParams } from './Demos';
import * as P from '../lib/physics';

const blue = '#2672d9';
const orange = '#d56138';
const green = '#14875f';
const purple = '#7654ba';

const dopingControl = (key: string, label: string): Control => ({ key, label, min: 1e15, max: 1e18, step: 1e14, unit: 'cm⁻³', log: true });
const temperatureControl: Control = { key: 'T', label: 'Temperature', min: 200, max: 450, step: 1, unit: 'K' };

export function DriftDiffusion() {
  const { v, set, reset } = useParams({ n0: 1e16, ell: 3, field: -100, mobility: 1400, T: 300 });
  const length = 5;
  const ellCm = v.ell * 1e-4;
  const density = (x: number) => v.n0 * Math.exp(x / v.ell);
  const current = (x: number) => P.electronTransport(density(x), density(x) / ellCm, v.field, v.mobility, v.T);
  const atSurface = current(0);
  const nondegenerate = P.fermiOffset('n', density(length), v.T).boltzmannValid;
  const densityScale = 10 ** Math.floor(Math.log10(v.n0));
  const densityCurve = pts(0, length, 100, x => density(x) / densityScale);
  const drift = pts(0, length, 100, x => current(x).drift);
  const diffusion = pts(0, length, 100, x => current(x).diffusion);
  const total = pts(0, length, 100, x => current(x).total);
  const maxCurrent = Math.max(1e-10, ...drift.map(p => Math.abs(p[1])), ...diffusion.map(p => Math.abs(p[1])), ...total.map(p => Math.abs(p[1])));
  return <DemoLayout calculation={<Calculation
    formula={String.raw`J_n=q\mu_n n\mathcal E+qD_n\frac{dn}{dx},\quad D_n=\mu_nV_T`}
    substitution={String.raw`J_n(0)=(${texSci(P.q)})(${fmt(v.mobility, 0)})(${texSci(v.n0)})\left[${fmt(v.field, 1)}+\frac{${fmt(P.thermalVoltage(v.T), 4)}}{${texSci(ellCm)}}\right]=${texSci(atSurface.total)}\,\mathrm{A/cm^2}`} />}
    controls={<Controls values={v} set={set} reset={reset} items={[
      { key: 'n0', label: 'Electron density at x = 0', min: 1e14, max: 1e18, step: 1e14, unit: 'cm⁻³', log: true },
      { key: 'ell', label: 'Density gradient length', min: 1, max: 8, step: .1, unit: 'µm' },
      { key: 'field', label: 'Electric field', min: -500, max: 500, step: 1, unit: 'V/cm' },
      { key: 'mobility', label: 'Electron mobility', min: 100, max: 1500, step: 10, unit: 'cm²/(V·s)' },
      temperatureControl,
    ]}><button className="reset-button" onClick={() => set('field', atSurface.equilibriumField)}>Set field for zero current</button></Controls>}>
    <Metrics><Metric label="Diffusion constant Dₙ" value={fmt(atSurface.D, 2)} unit="cm²/s" /><Metric label="Equilibrium field" value={fmt(atSurface.equilibriumField, 1)} unit="V/cm" /><Metric label="Total current at x = 0" value={sci(atSurface.total)} unit="A/cm²" /></Metrics>
    {!nondegenerate && <div className="notice">The far end of this density profile is within 3kT of the conduction band. The nondegenerate Einstein relation is outside its assumed range.</div>}
    <div className="graph-grid">
      <Plot title="Electron density" xLabel="Position (µm)" yLabel={`n (×10^${Math.floor(Math.log10(densityScale))} cm⁻³)`} xDomain={[0, length]} yDomain={[0, density(length) / densityScale * 1.12]} series={[{ name: 'n(x)', color: blue, points: densityCurve }]} points={[{ x: 0, y: v.n0 / densityScale, label: `n(0) ${sci(v.n0)} cm⁻³`, color: blue }]} onInspect={x => `n = ${sci(density(x))} cm⁻³`} />
      <Plot title="Drift and diffusion current" xLabel="Position (µm)" yLabel="Electron current density (A/cm²)" xDomain={[0, length]} yDomain={[-1.12 * maxCurrent, 1.12 * maxCurrent]} series={[{ name: 'Drift', color: orange, points: drift }, { name: 'Diffusion', color: blue, points: diffusion }, { name: 'Total', color: green, points: total }]} points={[{ x: 0, y: atSurface.total, label: `Jₙ(0) ${sci(atSurface.total)} A/cm²`, color: green }]} onInspect={x => `Jdrift ${sci(current(x).drift)} · Jdiff ${sci(current(x).diffusion)} · Jtotal ${sci(current(x).total)} A/cm²`} />
    </div>
    <Info intuition="Electrons spread down their concentration gradient. An opposing electric field can cancel their diffusion current exactly." model="The nondegenerate Einstein relation connects diffusivity and mobility. This illustration prescribes an exponential density profile and a uniform field." takeaway="At equilibrium, drift and diffusion currents are equal and opposite even though both carrier motions continue." derivation={[String.raw`J_n=q\mu_n n\mathcal E+qD_n\frac{dn}{dx}`, String.raw`\frac{D_n}{\mu_n}=\frac{kT}{q}=V_T`, String.raw`n(x)=n_0e^{x/\ell},\quad J_n=0\Rightarrow\mathcal E=-\frac{V_T}{\ell}`]} />
  </DemoLayout>;
}

export function MinorityDiffusion() {
  const { v, set, reset } = useParams({ ND: 1e16, excess: 1e14, field: 0, tau: 1e-6, mobility: 470, T: 300 });
  const [equilibrium, setEquilibrium] = useState(false);
  const field = equilibrium ? 0 : v.field;
  const excess = equilibrium ? 0 : v.excess;
  const p0 = P.ni(v.T) ** 2 / v.ND;
  const r = P.minorityHoles(0, excess, v.mobility, v.tau, v.T, field);
  const limit = 4 * P.um(r.L);
  const at = (x: number) => {
    const state = P.minorityHoles(x * 1e-4, excess, v.mobility, v.tau, v.T, field);
    const drift = state.driftCurrent + P.q * v.mobility * field * p0;
    return { ...state, density: p0 + state.excess, drift, total: drift + state.diffusionCurrent };
  };
  const edge = at(0);
  const concentrationScale = 10 ** Math.floor(Math.log10(Math.max(p0, excess, 1)));
  const currentRange = Math.max(1e-16, Math.abs(edge.total), Math.abs(edge.drift), Math.abs(edge.diffusionCurrent)) * 1.2;
  const lowInjection = equilibrium || excess < .1 * v.ND;
  const zeroField = field === 0;
  const driftSpeed = v.mobility * field;
  const signedDrift = driftSpeed >= 0 ? '+' + fmt(driftSpeed, 0) : fmt(driftSpeed, 0);
  const formula = equilibrium
    ? 'p_{n0}=\\frac{n_i^2}{N_D},\\quad \\Delta p=0,\\quad J_p=0'
    : zeroField
      ? 'L_p=\\sqrt{D_p\\tau_p},\\quad \\Delta p(x)=\\Delta p(0)e^{-x/L_p}'
      : 'D_p\\Delta p^{\\prime\\prime}-\\mu_p\\mathcal E\\Delta p^{\\prime}-\\frac{\\Delta p}{\\tau_p}=0';
  const substitution = equilibrium
    ? 'p_{n0}=\\frac{(' + texSci(P.ni(v.T)) + ')^2}{' + texSci(v.ND) + '}=' + texSci(p0) + '\\,\\mathrm{cm^{-3}},\\quad J_p=0'
    : zeroField
      ? 'L_p=10^4\\sqrt{(' + fmt(r.D, 2) + ')(' + texSci(v.tau) + ')}=' + fmt(P.um(r.L), 2) + '\\,\\mu\\mathrm m'
      : 'L_E=10^4\\frac{' + texSci(v.tau) + '}{2}\\left[\\sqrt{(' + fmt(driftSpeed, 0) + ')^2+\\frac{4(' + fmt(r.D, 2) + ')}{' + texSci(v.tau) + '}}' + signedDrift + '\\right]=' + fmt(P.um(r.L), 2) + '\\,\\mu\\mathrm m';
  const activeControls: Control[] = equilibrium ? [
    dopingControl('ND', 'N-side donor density'),
    temperatureControl,
  ] : [
    dopingControl('ND', 'N-side donor density'),
    { key: 'excess', label: 'Excess holes at x = 0', min: 1e11, max: 1e17, step: 1e11, unit: 'cm⁻³', log: true },
    { key: 'field', label: 'Electric field', min: -500, max: 500, step: 1, unit: 'V/cm' },
    { key: 'tau', label: 'Minority lifetime', min: 1e-9, max: 1e-3, step: 1e-9, unit: 's', log: true },
    { key: 'mobility', label: 'Hole mobility', min: 100, max: 500, step: 10, unit: 'cm²/(V·s)' },
    temperatureControl,
  ];
  return <DemoLayout calculation={<Calculation formula={formula} substitution={substitution} />}
    controls={<Controls values={v} set={set} reset={() => { reset(); setEquilibrium(false); }} items={activeControls}>
      <Toggle label="Thermal equilibrium: no field or excess carriers" checked={equilibrium} onChange={setEquilibrium} />
    </Controls>}>
    <Metrics>
      <Metric label="Effective decay length" value={equilibrium ? '—' : fmt(P.um(r.L), 2)} unit={equilibrium ? '' : 'µm'} />
      <Metric label="Zero-field diffusion length" value={fmt(P.um(r.L0), 2)} unit="µm" />
      <Metric label="Equilibrium holes pₙ₀" value={sci(p0)} unit="cm⁻³" />
      <Metric label="Hole current at x = 0" value={sci(edge.total)} unit="A/cm²" />
    </Metrics>
    {!lowInjection && <div className="notice">Excess holes exceed the low-level injection range (Δp(0) ≥ 0.1 Nᴅ). The exponential profile is an approximation here.</div>}
    {!P.fermiOffset('n', v.ND, v.T).boltzmannValid && <div className="notice">Doping is near the degenerate range; pₙ₀ = nᵢ²/Nᴅ uses nondegenerate statistics.</div>}
    <div className="graph-grid">
      <Plot title="Minority hole concentration" xLabel="Distance from edge (µm)" yLabel={'p (×10^' + Math.floor(Math.log10(concentrationScale)) + ' cm⁻³)'}
        xDomain={[0, limit]} yDomain={[0, (p0 + excess) / concentrationScale * 1.15]}
        series={[
          { name: 'p(x)', color: orange, points: pts(0, limit, 120, x => at(x).density / concentrationScale) },
          ...(!equilibrium ? [{ name: 'Equilibrium pₙ₀', color: '#83929d', points: [[0, p0 / concentrationScale], [limit, p0 / concentrationScale]] as [number, number][], dash: true }] : []),
        ]}
        points={[equilibrium
          ? { x: 0, y: p0 / concentrationScale, label: 'pₙ₀ ' + sci(p0) + ' cm⁻³', color: orange }
          : { x: P.um(r.L), y: (p0 + excess / Math.E) / concentrationScale, label: 'At Lᴇ: ' + sci(p0 + excess / Math.E) + ' cm⁻³', color: orange }]}
        onInspect={x => 'p ' + sci(at(x).density) + ' · Δp ' + sci(at(x).excess) + ' cm⁻³'} />
      <Plot title="Hole current components" xLabel="Distance from edge (µm)" yLabel="Jₚ (A/cm²)"
        xDomain={[0, limit]} yDomain={[-currentRange, currentRange]}
        series={[
          { name: 'Total', color: '#14875f', points: pts(0, limit, 120, x => at(x).total) },
          ...(!equilibrium ? [
            { name: 'Drift', color: orange, points: pts(0, limit, 120, x => at(x).drift) },
            { name: 'Diffusion', color: blue, points: pts(0, limit, 120, x => at(x).diffusionCurrent) },
          ] : []),
        ]}
        points={[{ x: 0, y: edge.total, label: 'Jₚ(0) ' + sci(edge.total) + ' A/cm²', color: '#14875f' }]}
        onInspect={x => 'Drift ' + sci(at(x).drift) + ' · Diffusion ' + sci(at(x).diffusionCurrent) + ' · Total ' + sci(at(x).total) + ' A/cm²'} />
    </div>
    <Info
      intuition={equilibrium ? 'With no injection and no applied field, minority holes stay at the uniform equilibrium density pₙ₀. Their net current is zero.' : 'Injected holes move by diffusion and, when a field is applied, drift. Recombination removes the excess holes as they travel into the n-type region.'}
      model={equilibrium ? 'In this uniform n-type region, pₙ₀ = nᵢ²/Nᴅ and Δp = 0. A zero field and zero gradient give Jₚ = 0.' : 'A uniform field and low-level injection give DₚΔp″ − μₚℰΔp′ − Δp/τₚ = 0. The total hole current includes drift of equilibrium holes plus the injected excess.'}
      takeaway={zeroField ? 'At zero field, the decay length is the familiar diffusion length √(Dₚτₚ).' : 'A field driving holes into the region lengthens their decay distance; the opposite field shortens it.'}
      derivation={equilibrium ? [
        'p_{n0}=n_i^2/N_D,\\quad \\Delta p=0',
        'J_p=q\\mu_p p\\mathcal E-qD_p\\frac{dp}{dx}=0',
      ] : [
        'J_p=q\\mu_p p\\mathcal E-qD_p\\frac{dp}{dx}',
        'D_p\\frac{d^2\\Delta p}{dx^2}-\\mu_p\\mathcal E\\frac{d\\Delta p}{dx}-\\frac{\\Delta p}{\\tau_p}=0',
        '\\Delta p(x)=\\Delta p(0)e^{-x/L_E},\\quad L_E=\\frac{\\tau_p}{2}\\left(\\sqrt{(\\mu_p\\mathcal E)^2+4D_p/\\tau_p}+\\mu_p\\mathcal E\\right)',
      ]} />
  </DemoLayout>;
}

export function IdealDiode() {
  const [logGraphs, setLogGraphs] = useState(false);
  const { v, set, reset } = useParams({ NA: 1e17, ND: 1e16, VA: .45, tau: 1e-6, T: 300, VBR: 5, VK: .1 });
  const kneeCurrent = 1e-3;
  const diodeAt = (bias: number) => P.diodeWithBreakdown(v.NA, v.ND, bias, v.T, v.tau, v.VBR, v.VK, kneeCurrent);
  const result = diodeAt(v.VA);
  const nondegenerate = P.fermiOffset('p', v.NA, v.T).boltzmannValid && P.fermiOffset('n', v.ND, v.T).boltzmannValid;
  const minBias = -v.VBR - 6 * v.VK;
  const biasRange: [number, number] = [minBias, .65];
  const setControl = (key: string, value: number) => {
    set(key, value);
    if (key === 'VBR' || key === 'VK') {
      const nextMin = -(key === 'VBR' ? value : v.VBR) - 6 * (key === 'VK' ? value : v.VK);
      if (v.VA < nextMin) set('VA', nextMin);
    }
  };
  // Resolve the breakdown knee and the narrow forward branch separately, including zero exactly.
  const currentSamples = [
    ...pts(minBias, -v.VBR, 100, bias => diodeAt(bias).J),
    ...pts(-v.VBR, 0, 100, bias => diodeAt(bias).J).slice(1),
    ...pts(0, biasRange[1], 180, bias => diodeAt(bias).J).slice(1),
  ];
  const currentY = (current: number) => logGraphs ? Math.log10(Math.max(Math.abs(current), result.J0 * 1e-6)) : current;
  const currentPoints: [number, number][] = currentSamples.map(([bias, current]) => [bias, currentY(current)]);
  const idealPoints: [number, number][] = currentSamples.map(([bias]) => [bias, currentY(diodeAt(bias).idealJ)]);
  const currentMin = Math.min(...currentPoints.map(([, current]) => current));
  const currentMax = Math.max(...currentPoints.map(([, current]) => current));
  const currentPadding = (currentMax - currentMin) * .08;
  const currentDomain: [number, number] = [currentMin - currentPadding, currentMax + currentPadding];

  // These remain the ideal injection boundary conditions, shown around the forward-bias region.
  const carrierRange: [number, number] = [-.5, .65];
  const holeY = (bias: number) => logGraphs ? Math.log10(diodeAt(bias).pnEdge) : diodeAt(bias).pnEdge;
  const electronY = (bias: number) => logGraphs ? Math.log10(diodeAt(bias).npEdge) : diodeAt(bias).npEdge;
  const carrierMin = logGraphs ? Math.min(holeY(carrierRange[0]), electronY(carrierRange[0])) - .5 : 0;
  const carrierMax = Math.max(holeY(carrierRange[1]), electronY(carrierRange[1]));
  const carrierDomain: [number, number] = [carrierMin, logGraphs ? carrierMax + .5 : carrierMax * 1.1];
  const showInjectionMarker = v.VA >= carrierRange[0] && v.VA <= carrierRange[1];
  return <DemoLayout calculation={<Calculation title="Diode model with reverse breakdown" forms={[
    { label: 'Ideal injection current', formula: String.raw`J_{ideal}=J_0\left(e^{V_A/V_T}-1\right)` },
    { label: 'Illustrative reverse-breakdown knee', formula: String.raw`J_{BR}=\begin{cases}0,&V_A\geq -V_{BR}\\-J_K\left[e^{(-V_A-V_{BR})/V_K}-1\right],&V_A<-V_{BR}\end{cases}` },
    { label: 'Total current density', formula: String.raw`J=J_{ideal}+J_{BR},\qquad J_K=10^{-3}\,\mathrm{A/cm^2}` },
  ]} substitution={String.raw`J=(${texSci(result.idealJ)})+(${texSci(result.breakdownJ)})=${texSci(result.J)}\,\mathrm{A/cm^2}`} />}
    controls={<Controls values={v} set={setControl} reset={() => { reset(); setLogGraphs(false); }} items={[
      dopingControl('NA', 'P-side acceptors'), dopingControl('ND', 'N-side donors'),
      { key: 'VA', label: 'Applied voltage', min: minBias, max: .65, step: .005, unit: 'V' },
      { key: 'VBR', label: 'Reverse breakdown voltage', min: 1, max: 20, step: .1, unit: 'V' },
      { key: 'VK', label: 'Breakdown knee voltage scale', min: .02, max: .5, step: .01, unit: 'V' },
      { key: 'tau', label: 'Minority lifetime', min: 1e-9, max: 1e-3, step: 1e-9, unit: 's', log: true },
      temperatureControl,
    ]}><Toggle label="Logarithmic graph axes" checked={logGraphs} onChange={setLogGraphs} /></Controls>}>
    <Metrics>
      <Metric label="Current density J" value={sci(result.J)} unit="A/cm²" />
      <Metric label="Saturation density J₀" value={sci(result.J0)} unit="A/cm²" />
      <Metric label="Breakdown contribution" value={sci(result.breakdownJ)} unit="A/cm²" />
      <Metric label="Operating region" value={result.inBreakdown ? 'Reverse breakdown' : v.VA > 0 ? 'Forward bias' : v.VA < 0 ? 'Reverse saturation' : 'Equilibrium'} />
    </Metrics>
    {!result.lowInjection && <div className="notice">The selected forward bias violates the low-level-injection condition. The ideal injection equation is extrapolated outside its stated range.</div>}
    {!nondegenerate && <div className="notice">One side is within 3kT of a band edge. The Boltzmann injection boundary concentrations are outside their assumed range.</div>}
    <div className="notice small">The reverse-breakdown knee is an illustrative exponential extension. VBR and its knee scale are chosen independently of doping; series resistance and heating are omitted. The carrier plot shows the ideal injection model around forward bias and excludes carriers generated during breakdown.</div>
    <div className="breakdown-related"><Link href="/avalanche-breakdown">Animate avalanche multiplication →</Link><Link href="/zener-breakdown">Animate Zener tunneling →</Link></div>
    {logGraphs && <div className="notice small">Log view shows current magnitude; reverse current is negative in linear view. Zero current is drawn at a display floor of 10⁻⁶ J₀.</div>}
    <div className="graph-grid">
      <Plot title="Diode I–V with reverse breakdown" xLabel="Applied voltage (V)"
        yLabel={logGraphs ? 'log₁₀ |J| (A/cm²)' : 'J (A/cm²)'} xDomain={biasRange} yDomain={currentDomain}
        series={[
          { name: 'With breakdown', color: blue, points: currentPoints },
          { name: 'Ideal reference', color: '#87949e', points: idealPoints, dash: true },
        ]}
        zones={[{ from: minBias, to: -v.VBR, color: orange }]}
        markers={[{ x: -v.VBR, label: 'Breakdown −' + fmt(v.VBR, 2) + ' V' }, { x: v.VA, label: 'Vₐ ' + fmt(v.VA, 3) + ' V' }]}
        points={[{ x: v.VA, y: currentY(result.J), label: 'J ' + sci(result.J) + ' A/cm²', color: blue }]}
        onInspect={bias => 'J ' + sci(diodeAt(bias).J) + ' A/cm² · ' + (bias < -v.VBR ? 'Reverse breakdown' : bias < 0 ? 'Reverse saturation' : 'Forward bias')} />
      <Plot title="Minority carriers: ideal injection" xLabel="Applied voltage (V)"
        yLabel={logGraphs ? 'log₁₀ density (cm⁻³)' : 'Density (cm⁻³)'} xDomain={carrierRange} yDomain={carrierDomain}
        series={[
          { name: 'Holes on n side', color: orange, points: pts(...carrierRange, 180, holeY) },
          { name: 'Electrons on p side', color: purple, points: pts(...carrierRange, 180, electronY) },
        ]}
        markers={showInjectionMarker ? [{ x: v.VA, label: 'Vₐ ' + fmt(v.VA, 3) + ' V' }] : []}
        points={showInjectionMarker ? [
          { x: v.VA, y: holeY(v.VA), label: 'pₙ ' + sci(result.pnEdge), color: orange },
          { x: v.VA, y: electronY(v.VA), label: 'nₚ ' + sci(result.npEdge), color: purple },
        ] : []}
        onInspect={bias => 'pₙ ' + sci(diodeAt(bias).pnEdge) + ' · nₚ ' + sci(diodeAt(bias).npEdge) + ' cm⁻³'} />
    </div>
    <Info intuition="Forward injection produces the rising positive-current branch. In reverse bias, leakage stays near −J₀ until the added breakdown knee makes the reverse current grow rapidly."
      model="The forward and leakage currents use the ideal long-base PN model. An empirical exponential term supplies the reverse-breakdown branch, with an independently selected voltage and knee scale."
      takeaway="Move the voltage past −VBR to enter reverse breakdown. A smaller knee voltage scale makes the reverse branch steeper."
      derivation={[String.raw`J_0=qn_i^2\left(\frac{D_n}{L_nN_A}+\frac{D_p}{L_pN_D}\right),\qquad L_{n,p}=\sqrt{D_{n,p}\tau}`]} />
  </DemoLayout>;
}

export function ContinuityEquation() {
  const { v, set, reset } = useParams({ deltaJn: .004, deltaJp: -.002, field: 100, deltaN: 2.7e11, deltaP: -4e11, G: 2e19, R: 1e19 });
  const lengthUm = 10, lengthCm = lengthUm * 1e-4;
  const r = P.continuityRates(v.deltaJn, v.deltaJp, lengthCm, v.G, v.R);
  const split = P.continuityCurrentSplit(v.deltaJn, v.deltaJp, v.field, v.deltaN, v.deltaP);
  const currentMax = Math.max(.001, Math.abs(v.deltaJn) / 2, Math.abs(v.deltaJp) / 2) * 1.2;
  const scale = 1e19;
  const rates = [r.electronRate / scale, r.holeRate / scale, r.pairRate / scale];
  const rateMin = Math.min(0, ...rates), rateMax = Math.max(0, ...rates);
  const ratePadding = Math.max(1, rateMax - rateMin) * .18;
  return <DemoLayout calculation={<Calculation title="Continuity equations"
    forms={[
      { label: 'Current divergence', formula: String.raw`\begin{aligned}
        \frac{\partial n}{\partial t}&=\frac{1}{q}\frac{\partial J_n}{\partial x}+G-R\\
        \frac{\partial p}{\partial t}&=-\frac{1}{q}\frac{\partial J_p}{\partial x}+G-R
      \end{aligned}` },
      { label: 'Uniform-field drift and diffusion', formula: String.raw`\begin{aligned}
        \frac{\partial n}{\partial t}&=\mu_n\mathcal E\frac{\partial n}{\partial x}+D_n\frac{\partial^2 n}{\partial x^2}+G-R\\
        \frac{\partial p}{\partial t}&=-\mu_p\mathcal E\frac{\partial p}{\partial x}+D_p\frac{\partial^2 p}{\partial x^2}+G-R
      \end{aligned}` },
      { label: 'Across the 10 µm slice', formula: String.raw`\begin{aligned}
        \dot n&=\frac{\Delta J_{n,\mathrm{drift}}+\Delta J_{n,\mathrm{diff}}}{q\,\Delta x}+G-R\\
        \dot p&=-\frac{\Delta J_{p,\mathrm{drift}}+\Delta J_{p,\mathrm{diff}}}{q\,\Delta x}+G-R
      \end{aligned}` },
    ]}
    substitution={'\\begin{aligned}\\dot n&=\\frac{' + texSci(split.driftJn) + '+(' + texSci(split.diffJn) + ')}{' + texSci(P.q * lengthCm) + '}+(' + texSci(r.pairRate) + ')=' + texSci(r.electronRate) + '\\\\\\dot p&=-\\frac{' + texSci(split.driftJp) + '+(' + texSci(split.diffJp) + ')}{' + texSci(P.q * lengthCm) + '}+(' + texSci(r.pairRate) + ')=' + texSci(r.holeRate) + '\\end{aligned}\\;\\mathrm{cm^{-3}s^{-1}}'} />}
    controls={<Controls values={v} set={set} reset={reset} items={[
      { key: 'deltaJn', label: 'Electron current change ΔJₙ', min: -.02, max: .02, step: .0001, unit: 'A/cm²' },
      { key: 'deltaJp', label: 'Hole current change ΔJₚ', min: -.02, max: .02, step: .0001, unit: 'A/cm²' },
      { key: 'field', label: 'Electric field ℰ', min: -300, max: 300, step: 1, unit: 'V/cm' },
      { key: 'deltaN', label: 'Electron density change across slice Δn', min: -1e12, max: 1e12, step: 1e9, unit: 'cm⁻³' },
      { key: 'deltaP', label: 'Hole density change across slice Δp', min: -1e12, max: 1e12, step: 1e9, unit: 'cm⁻³' },
      { key: 'G', label: 'Pair generation G', min: 1e16, max: 1e21, step: 1e16, unit: 'cm⁻³/s', log: true },
      { key: 'R', label: 'Pair recombination R', min: 1e16, max: 1e21, step: 1e16, unit: 'cm⁻³/s', log: true },
    ]} />}>
    <Metrics><Metric label="Electron density rate" value={sci(r.electronRate)} unit="cm⁻³/s" /><Metric label="Hole density rate" value={sci(r.holeRate)} unit="cm⁻³/s" /><Metric label="Net pair rate G−R" value={sci(r.pairRate)} unit="cm⁻³/s" /><Metric label="Charge rate" value={sci(r.chargeRate)} unit="C/(cm³·s)" /></Metrics>
    <ContinuityDiagram deltaJn={v.deltaJn} deltaJp={v.deltaJp} driftJn={split.driftJn} driftJp={split.driftJp} field={v.field} generation={v.G} recombination={v.R} lengthUm={lengthUm} />
    <div className="graph-grid">
      <Plot title="Net current across a 10 µm slice" xLabel="Position (µm)" yLabel="Current density (A/cm²)" xDomain={[0, lengthUm]} yDomain={[-currentMax, currentMax]} series={[
        { name: 'Jₙ', color: blue, points: [[0, -v.deltaJn / 2], [lengthUm, v.deltaJn / 2]] },
        { name: 'Jₚ', color: orange, points: [[0, -v.deltaJp / 2], [lengthUm, v.deltaJp / 2]] },
      ]} points={[
        { x: lengthUm, y: v.deltaJn / 2, label: 'ΔJₙ ' + sci(v.deltaJn) + ' A/cm²', color: blue },
        { x: lengthUm, y: v.deltaJp / 2, label: 'ΔJₚ ' + sci(v.deltaJp) + ' A/cm²', color: orange },
      ]} onInspect={x => 'Jₙ ' + sci(v.deltaJn * (x / lengthUm - .5)) + ' · Jₚ ' + sci(v.deltaJp * (x / lengthUm - .5)) + ' A/cm²'} />
      <Plot title="Instantaneous carrier balance" xLabel="Position (µm)" yLabel="Rate (10¹⁹ cm⁻³/s)" xDomain={[0, lengthUm]} yDomain={[rateMin - ratePadding, rateMax + ratePadding]} series={[
        { name: '∂n/∂t', color: blue, points: [[0, rates[0]], [lengthUm, rates[0]]] },
        { name: '∂p/∂t', color: orange, points: [[0, rates[1]], [lengthUm, rates[1]]] },
        { name: 'G−R', color: green, points: [[0, rates[2]], [lengthUm, rates[2]]] },
      ]} points={[
        { x: 2, y: rates[0], label: '∂n/∂t ' + sci(r.electronRate), color: blue },
        { x: 5, y: rates[1], label: '∂p/∂t ' + sci(r.holeRate), color: orange },
      ]} onInspect={() => 'Electron ' + sci(r.electronRate) + ' · Hole ' + sci(r.holeRate) + ' cm⁻³/s'} />
    </div>
    <Info intuition="Carriers enter and leave a small slice through its faces. Generation adds an electron and a hole together; recombination removes them together." model="With a uniform field, the drift-current changes are qμₙℰΔn and qμₚℰΔp. Diffusion is the remainder of each prescribed total current change. The demo uses μₙ = 1400 and μₚ = 470 cm²/(V·s)." takeaway="A zero field removes drift; changing the field shifts the drift and inferred diffusion contributions while the selected total current change stays fixed." derivation={['\\Delta J_{n,\\mathrm{drift}}=q\\mu_n\\mathcal E\\Delta n,\\quad\\Delta J_{p,\\mathrm{drift}}=q\\mu_p\\mathcal E\\Delta p', '\\Delta J_{n,p}=\\Delta J_{n,p,\\mathrm{drift}}+\\Delta J_{n,p,\\mathrm{diff}}', '\\frac{\\partial n}{\\partial t}=\\frac{1}{q}\\frac{\\partial J_n}{\\partial x}+G-R', '\\frac{\\partial p}{\\partial t}=-\\frac{1}{q}\\frac{\\partial J_p}{\\partial x}+G-R', '\\frac{\\partial\\rho}{\\partial t}=-\\frac{\\partial(J_n+J_p)}{\\partial x}']} />
  </DemoLayout>;
}

export function QuasiFermiLevels() {
  const [logInjection, setLogInjection] = useState(true);
  const { v, set, reset } = useParams({ dopant: 1e16, excess: 1e14, T: 300 });
  const [type, setType] = useState<'n' | 'p'>('n');
  const [equilibrium, setEquilibrium] = useState(false);
  const base = P.dopedFermi(type, v.dopant, v.T);
  const r = P.injectedQuasiFermi(base, equilibrium ? 0 : v.excess);
  const samples = pts(6, 18, 80, x => x);
  const states = samples.map(([x]) => P.injectedQuasiFermi(base, 10 ** x));
  const fnCurve: [number, number][] = samples.map(([x], index) => [logInjection ? x : 10 ** x, states[index].Fn]);
  const fpCurve: [number, number][] = samples.map(([x], index) => [logInjection ? x : 10 ** x, states[index].Fp]);
  const injectionX = logInjection ? Math.log10(v.excess) : v.excess;
  const injectionDomain: [number, number] = logInjection ? [6, 18] : [1e6, 1e18];
  const curveMin = Math.min(base.Ev - .1, ...fpCurve.map(point => point[1])) - .06;
  const curveMax = Math.max(base.Ec + .1, ...fnCurve.map(point => point[1])) + .06;
  const minEnergy = Math.min(base.Ev, r.Fp) - .16, maxEnergy = Math.max(base.Ec, r.Fn) + .16;
  const bandLine = (energy: number): [number, number][] => [[-1, energy], [1, energy]];
  const electronEta = (r.Fn - r.Ec) / base.Vt, holeEta = (r.Ev - r.Fp) / base.Vt;
  const formula = '\\begin{aligned}F_n&=E_C+kT F_{1/2}^{-1}(n/N_C)\\\\F_p&=E_V-kT F_{1/2}^{-1}(p/N_V)\\end{aligned}';
  const substitution = '\\begin{aligned}F_n&=' + fmt(r.Ec, 3) + '+(' + fmt(base.Vt, 4) + ')(' + fmt(electronEta, 2) + ')=' + fmt(r.Fn, 3) + '\\,\\mathrm{eV}\\\\F_p&=' + fmt(r.Ev, 3) + '-(' + fmt(base.Vt, 4) + ')(' + fmt(holeEta, 2) + ')=' + fmt(r.Fp, 3) + '\\,\\mathrm{eV}\\end{aligned}';
  const distance = type === 'n' ? base.Ec - base.Ef : base.Ef - base.Ev;
  const setControl = (key: string, value: number) => { set(key, value); if (key === 'excess') setEquilibrium(false); };
  return <DemoLayout calculation={<Calculation formula={formula} substitution={substitution} />}
    controls={<Controls values={v} set={setControl} reset={() => { reset(); setType('n'); setEquilibrium(false); setLogInjection(true); }} items={[
      { key: 'dopant', label: type === 'n' ? 'Donor concentration Nᴅ' : 'Acceptor concentration Nₐ', min: 1e15, max: 1e19, step: 1e14, unit: 'cm⁻³', log: true },
      ...(!equilibrium ? [{ key: 'excess', label: 'Injected electron–hole pairs', min: 1e6, max: 1e18, step: 1e6, unit: 'cm⁻³', log: true }] : []),
      temperatureControl,
    ]}>
      <div className="chips" role="group" aria-label="Doping type">
        <button className={type === 'n' ? 'active' : ''} onClick={() => setType('n')}>N-type donors</button>
        <button className={type === 'p' ? 'active' : ''} onClick={() => setType('p')}>P-type acceptors</button>
      </div>
      <Toggle label="Thermal equilibrium (no excess carriers)" checked={equilibrium} onChange={setEquilibrium} />
      <Toggle label="Logarithmic injection axis" checked={logInjection} onChange={setLogInjection} />
    </Controls>}>
    <Metrics>
      <Metric label="Equilibrium Fermi level Eꜰ" value={fmt(base.Ef, 3)} unit="eV from Eᵢ" />
      <Metric label={type === 'n' ? 'Eᴄ − Eꜰ' : 'Eꜰ − Eᴠ'} value={fmt(distance, 3)} unit="eV" />
      <Metric label="Electrons n" value={sci(r.n)} unit="cm⁻³" />
      <Metric label="Holes p" value={sci(r.p)} unit="cm⁻³" />
      <Metric label="Quasi-Fermi split" value={fmt(r.split, 3)} unit="eV" />
    </Metrics>
    {v.dopant >= 3e18 && <div className="notice">At very high doping, this ideal-band model omits bandgap narrowing and dopant-ionization effects.</div>}
    <div className="graph-grid">
      <Plot title="Energy bands and Fermi levels" xLabel="Position (relative)" yLabel="Energy (eV)" xDomain={[-1, 1]} yDomain={[minEnergy, maxEnergy]} series={[
        { name: 'Eᴄ', color: blue, points: bandLine(r.Ec) },
        { name: 'Eᵢ', color: '#ae7b16', points: bandLine(0), dash: true },
        { name: 'Eᴠ', color: green, points: bandLine(r.Ev) },
        ...(equilibrium ? [{ name: 'Eꜰ', color: purple, points: bandLine(base.Ef) }] : [
          { name: 'Fₙ', color: blue, points: bandLine(r.Fn) },
          { name: 'Fₚ', color: orange, points: bandLine(r.Fp) },
        ]),
      ]} brackets={equilibrium ? [] : [{ x: .5, from: r.Fp, to: r.Fn, label: 'Fₙ−Fₚ ' + fmt(r.split, 3) + ' eV', color: purple }]}
        points={equilibrium ? [{ x: -.7, y: base.Ef, label: 'Eꜰ ' + fmt(base.Ef, 3) + ' eV', color: purple }] : [
          { x: -.65, y: r.Fn, label: 'Fₙ ' + fmt(r.Fn, 3) + ' eV', color: blue },
          { x: -.65, y: r.Fp, label: 'Fₚ ' + fmt(r.Fp, 3) + ' eV', color: orange },
        ]}
        onInspect={() => 'Eᴄ ' + fmt(r.Ec) + ' · Fₙ ' + fmt(r.Fn) + ' · Fₚ ' + fmt(r.Fp) + ' · Eᴠ ' + fmt(r.Ev) + ' eV'} />
      <Plot title="Quasi-Fermi levels with injection" xLabel={logInjection ? 'log₁₀ injected pairs (cm⁻³)' : 'Injected pairs (cm⁻³)'} yLabel="Energy from Eᵢ (eV)" xDomain={injectionDomain} yDomain={[curveMin, curveMax]} series={[
        { name: 'Fₙ', color: blue, points: fnCurve },
        { name: 'Fₚ', color: orange, points: fpCurve },
        { name: 'Equilibrium Eꜰ', color: purple, points: [[injectionDomain[0], base.Ef], [injectionDomain[1], base.Ef]], dash: true },
      ]} markers={equilibrium ? [] : [{ x: injectionX, label: 'Selected Δ ' + sci(v.excess) + ' cm⁻³' }]}
        points={equilibrium ? [] : [
          { x: injectionX, y: r.Fn, label: 'Fₙ ' + fmt(r.Fn, 3) + ' eV', color: blue },
          { x: injectionX, y: r.Fp, label: 'Fₚ ' + fmt(r.Fp, 3) + ' eV', color: orange },
        ]}
        onInspect={x => { const state = P.injectedQuasiFermi(base, logInjection ? 10 ** x : x); return 'Fₙ ' + fmt(state.Fn) + ' · Fₚ ' + fmt(state.Fp) + ' eV'; }} />
    </div>
    <Info
      intuition={type === 'n' ? 'More donors move the equilibrium Fermi level toward the conduction band. Injection then separates the electron and hole quasi-Fermi levels.' : 'More acceptors move the equilibrium Fermi level toward the valence band. Injection then separates the electron and hole quasi-Fermi levels.'}
      model="The equilibrium level solves charge neutrality with Fermi–Dirac carrier statistics. Equal excess electrons and holes preserve net charge while moving Fₙ and Fₚ apart."
      takeaway="Doping sets the equilibrium Fermi-level position; nonequilibrium injection creates quasi-Fermi-level splitting."
      derivation={[
        type === 'n' ? 'n_0-p_0=N_D' : 'p_0-n_0=N_A',
        'n=N_CF_{1/2}((F_n-E_C)/kT),\\qquad p=N_VF_{1/2}((E_V-F_p)/kT)',
        '\\Delta n=\\Delta p,\\qquad F_n=F_p=E_F\\;\\text{at equilibrium}',
      ]} />
  </DemoLayout>;
}
