'use client';

import { useState } from 'react';
import Plot from './Plot';
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
  const { v, set, reset } = useParams({ ND: 1e16, excess: 1e14, tau: 1e-6, mobility: 470, T: 300 });
  const r = P.minorityHoles(0, v.excess, v.mobility, v.tau, v.T);
  const limit = 4 * P.um(r.L);
  const concentration = (x: number) => P.minorityHoles(x * 1e-4, v.excess, v.mobility, v.tau, v.T);
  const p0 = P.ni(v.T) ** 2 / v.ND;
  const scale = 10 ** Math.floor(Math.log10(v.excess));
  const lowInjection = v.excess < .1 * v.ND;
  return <DemoLayout calculation={<Calculation formula={String.raw`L_p=\sqrt{D_p\tau_p},\quad \Delta p(x)=\Delta p(0)e^{-x/L_p}`}
    substitution={String.raw`L_p=10^4\sqrt{(${fmt(r.D, 2)})(${texSci(v.tau)})}=${fmt(P.um(r.L), 2)},\mu\mathrm m`} />}
    controls={<Controls values={v} set={set} reset={reset} items={[
      dopingControl('ND', 'N-side donor density'),
      { key: 'excess', label: 'Excess holes at x = 0', min: 1e11, max: 1e17, step: 1e11, unit: 'cm⁻³', log: true },
      { key: 'tau', label: 'Minority lifetime', min: 1e-9, max: 1e-3, step: 1e-9, unit: 's', log: true },
      { key: 'mobility', label: 'Hole mobility', min: 100, max: 500, step: 10, unit: 'cm²/(V·s)' },
      temperatureControl,
    ]} />}>
    <Metrics><Metric label="Diffusion length Lₚ" value={fmt(P.um(r.L), 2)} unit="µm" /><Metric label="Diffusion constant Dₚ" value={fmt(r.D, 2)} unit="cm²/s" /><Metric label="Equilibrium holes pₙ₀" value={sci(p0)} unit="cm⁻³" /><Metric label="Current at x = 0" value={sci(r.diffusionCurrent)} unit="A/cm²" /></Metrics>
    {!lowInjection && <div className="notice">Excess holes are too large for low-level injection (Δp(0) ≥ 0.1 Nᴅ). The exponential profile is only a teaching approximation here.</div>}
    <div className="graph-grid">
      <Plot title="Excess minority holes" xLabel="Distance from injection edge (µm)" yLabel={`Δp (×10^${Math.floor(Math.log10(scale))} cm⁻³)`} xDomain={[0, limit]} yDomain={[0, v.excess / scale * 1.12]} series={[{ name: 'Δp(x)', color: orange, points: pts(0, limit, 120, x => concentration(x).excess / scale) }]} points={[{ x: P.um(r.L), y: v.excess / (Math.E * scale), label: `At Lₚ: ${sci(v.excess / Math.E)} cm⁻³`, color: orange }]} onInspect={x => `Δp = ${sci(concentration(x).excess)} cm⁻³`} />
      <Plot title="Hole diffusion current" xLabel="Distance from injection edge (µm)" yLabel="Jₚ,diff (A/cm²)" xDomain={[0, limit]} yDomain={[0, r.diffusionCurrent * 1.12]} series={[{ name: 'Jₚ,diff(x)', color: blue, points: pts(0, limit, 120, x => concentration(x).diffusionCurrent) }]} points={[{ x: 0, y: r.diffusionCurrent, label: `Jₚ(0) ${sci(r.diffusionCurrent)} A/cm²`, color: blue }]} onInspect={x => `Jₚ,diff = ${sci(concentration(x).diffusionCurrent)} A/cm²`} />
    </div>
    <Info intuition="Injected minority holes spread into n-type silicon and recombine. Their excess density falls by a factor of e every diffusion length." model="Steady state, uniform doping, a small electric field, and low-level injection give Dₚ d²Δp/dx² − Δp/τₚ = 0." takeaway="Longer lifetime or larger diffusivity lets minority carriers travel farther before recombining." derivation={[String.raw`D_p\frac{d^2\Delta p}{dx^2}-\frac{\Delta p}{\tau_p}=0`, String.raw`L_p=\sqrt{D_p\tau_p},\quad \Delta p(x)=\Delta p(0)e^{-x/L_p}`, String.raw`J_{p,\mathrm{diff}}=-qD_p\frac{dp}{dx}=\frac{qD_p\Delta p(0)}{L_p}e^{-x/L_p}`]} />
  </DemoLayout>;
}

export function IdealDiode() {
  const { v, set, reset } = useParams({ NA: 1e17, ND: 1e16, VA: .45, tau: 1e-6, T: 300 });
  const result = P.idealDiode(v.NA, v.ND, v.VA, v.T, v.tau);
  const nondegenerate = P.fermiOffset('p', v.NA, v.T).boltzmannValid && P.fermiOffset('n', v.ND, v.T).boltzmannValid;
  const biasRange: [number, number] = [-.5, .65];
  const diodeAt = (bias: number) => P.idealDiode(v.NA, v.ND, bias, v.T, v.tau);
  const logCurrent = (bias: number) => Math.log10(Math.max(Math.abs(diodeAt(bias).J), result.J0 * 1e-6));
  const logHole = (bias: number) => Math.log10(diodeAt(bias).pnEdge);
  const logElectron = (bias: number) => Math.log10(diodeAt(bias).npEdge);
  const yMin = Math.log10(result.J0) - 6.5;
  const yMax = Math.max(logCurrent(biasRange[1]), Math.log10(result.J0)) + .5;
  const carrierMin = Math.min(logHole(biasRange[0]), logElectron(biasRange[0])) - .5;
  const carrierMax = Math.max(logHole(biasRange[1]), logElectron(biasRange[1])) + .5;
  return <DemoLayout calculation={<Calculation formula={String.raw`J=J_0\left(e^{V_A/V_T}-1\right)`}
    substitution={String.raw`J=(${texSci(result.J0)})\left[e^{${fmt(v.VA, 3)}/${fmt(P.thermalVoltage(v.T), 4)}}-1\right]=${texSci(result.J)}\,\mathrm{A/cm^2}`} />}
    controls={<Controls values={v} set={set} reset={reset} items={[
      dopingControl('NA', 'P-side acceptors'), dopingControl('ND', 'N-side donors'),
      { key: 'VA', label: 'Applied voltage', min: -.5, max: .65, step: .005, unit: 'V' },
      { key: 'tau', label: 'Minority lifetime', min: 1e-9, max: 1e-3, step: 1e-9, unit: 's', log: true },
      temperatureControl,
    ]} />}>
    <Metrics><Metric label="Current density J" value={sci(result.J)} unit="A/cm²" /><Metric label="Saturation density J₀" value={sci(result.J0)} unit="A/cm²" /><Metric label="N-side edge holes" value={sci(result.pnEdge)} unit="cm⁻³" /><Metric label="P-side edge electrons" value={sci(result.npEdge)} unit="cm⁻³" /></Metrics>
    {!result.lowInjection && <div className="notice">The selected forward bias violates the low-level-injection condition. The ideal diode equation is extrapolated outside its stated range.</div>}
    {!nondegenerate && <div className="notice">One side is within 3kT of a band edge. The Boltzmann boundary concentrations used by the ideal diode equation are inaccurate.</div>}
    <div className="notice small">The current plot uses a logarithmic magnitude. Exactly zero current at 0 V is shown at a display floor of 10⁻⁶ J₀; the calculated current remains zero.</div>
    <div className="graph-grid">
      <Plot title="Ideal diode I–V" xLabel="Applied voltage (V)" yLabel="log₁₀ |J| (A/cm²)" xDomain={biasRange} yDomain={[yMin, yMax]} series={[{ name: 'Current magnitude', color: blue, points: pts(...biasRange, 180, logCurrent) }]} markers={[{ x: v.VA, label: `Vₐ ${fmt(v.VA, 3)} V` }]} points={[{ x: v.VA, y: logCurrent(v.VA), label: `J ${sci(result.J)} A/cm²`, color: blue }]} onInspect={bias => `J = ${sci(diodeAt(bias).J)} A/cm²`} />
      <Plot title="Minority carriers at depletion edges" xLabel="Applied voltage (V)" yLabel="log₁₀ density (cm⁻³)" xDomain={biasRange} yDomain={[carrierMin, carrierMax]} series={[{ name: 'Holes on n side', color: orange, points: pts(...biasRange, 180, logHole) }, { name: 'Electrons on p side', color: purple, points: pts(...biasRange, 180, logElectron) }]} markers={[{ x: v.VA, label: `Vₐ ${fmt(v.VA, 3)} V` }]} points={[{ x: v.VA, y: logHole(v.VA), label: `pₙ ${sci(result.pnEdge)}`, color: orange }, { x: v.VA, y: logElectron(v.VA), label: `nₚ ${sci(result.npEdge)}`, color: purple }]} onInspect={bias => `pₙ = ${sci(diodeAt(bias).pnEdge)} · nₚ = ${sci(diodeAt(bias).npEdge)} cm⁻³`} />
    </div>
    <Info intuition="Forward bias lowers the junction barrier, so minority-carrier injection grows exponentially. Reverse bias removes minority carriers from the edges and approaches a nearly constant reverse current." model="The ideal long-base step-junction model uses low-level injection, steady state, complete ionization, negligible depletion-region recombination, and constant 300 K reference mobilities scaled only through the Einstein relation." takeaway="A change of roughly 60 mV produces a decade of forward-current change near 300 K when the exponential term dominates." derivation={[String.raw`n_{p0}=\frac{n_i^2}{N_A},\quad p_{n0}=\frac{n_i^2}{N_D}`, String.raw`n_p(-x_p)=n_{p0}e^{V_A/V_T},\quad p_n(x_n)=p_{n0}e^{V_A/V_T}`, String.raw`J_0=qn_i^2\left(\frac{D_n}{L_nN_A}+\frac{D_p}{L_pN_D}\right)`, String.raw`J=J_0(e^{V_A/V_T}-1),\quad L_{n,p}=\sqrt{D_{n,p}\tau}`]} />
  </DemoLayout>;
}

export function ContinuityEquation() {
  const { v, set, reset } = useParams({ deltaJn: .004, deltaJp: -.002, G: 2e19, R: 1e19 });
  const lengthUm = 10, lengthCm = lengthUm * 1e-4;
  const r = P.continuityRates(v.deltaJn, v.deltaJp, lengthCm, v.G, v.R);
  const currentMax = Math.max(.001, Math.abs(v.deltaJn) / 2, Math.abs(v.deltaJp) / 2) * 1.2;
  const scale = 1e19;
  const rates = [r.electronRate / scale, r.holeRate / scale, r.pairRate / scale];
  const rateMin = Math.min(0, ...rates), rateMax = Math.max(0, ...rates);
  const ratePadding = Math.max(1, rateMax - rateMin) * .18;
  return <DemoLayout calculation={<Calculation
    formula={'\\begin{aligned}\\frac{\\partial n}{\\partial t}&=\\frac{1}{q}\\frac{\\partial J_n}{\\partial x}+G-R\\\\\\frac{\\partial p}{\\partial t}&=-\\frac{1}{q}\\frac{\\partial J_p}{\\partial x}+G-R\\end{aligned}'}
    substitution={'\\begin{aligned}\\dot n&=\\frac{' + texSci(v.deltaJn) + '}{(' + texSci(P.q) + ')(' + texSci(lengthCm) + ')}+(' + texSci(r.pairRate) + ')=' + texSci(r.electronRate) + '\\\\\\dot p&=-\\frac{' + texSci(v.deltaJp) + '}{(' + texSci(P.q) + ')(' + texSci(lengthCm) + ')}+(' + texSci(r.pairRate) + ')=' + texSci(r.holeRate) + '\\end{aligned}\\;\\mathrm{cm^{-3}s^{-1}}'} />}
    controls={<Controls values={v} set={set} reset={reset} items={[
      { key: 'deltaJn', label: 'Electron current change ΔJₙ', min: -.02, max: .02, step: .0001, unit: 'A/cm²' },
      { key: 'deltaJp', label: 'Hole current change ΔJₚ', min: -.02, max: .02, step: .0001, unit: 'A/cm²' },
      { key: 'G', label: 'Pair generation G', min: 1e16, max: 1e21, step: 1e16, unit: 'cm⁻³/s', log: true },
      { key: 'R', label: 'Pair recombination R', min: 1e16, max: 1e21, step: 1e16, unit: 'cm⁻³/s', log: true },
    ]} />}>
    <Metrics><Metric label="Electron density rate" value={sci(r.electronRate)} unit="cm⁻³/s" /><Metric label="Hole density rate" value={sci(r.holeRate)} unit="cm⁻³/s" /><Metric label="Net pair rate G−R" value={sci(r.pairRate)} unit="cm⁻³/s" /><Metric label="Charge rate" value={sci(r.chargeRate)} unit="C/(cm³·s)" /></Metrics>
    <div className="graph-grid">
      <Plot title="Current across a 10 µm slice" xLabel="Position (µm)" yLabel="Current density (A/cm²)" xDomain={[0, lengthUm]} yDomain={[-currentMax, currentMax]} series={[
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
    <Info intuition="Carriers enter and leave a small slice through its faces. Generation adds an electron and a hole together; recombination removes them together." model="A positive electron-current gradient raises n, while a positive hole-current gradient lowers p, because conventional electron current points opposite electron flow." takeaway="Pair processes do not create net charge: q(∂p/∂t−∂n/∂t) = −∂(Jₙ+Jₚ)/∂x." derivation={['\\frac{\\partial n}{\\partial t}=\\frac{1}{q}\\frac{\\partial J_n}{\\partial x}+G-R', '\\frac{\\partial p}{\\partial t}=-\\frac{1}{q}\\frac{\\partial J_p}{\\partial x}+G-R', '\\frac{\\partial\\rho}{\\partial t}=-\\frac{\\partial(J_n+J_p)}{\\partial x}']} />
  </DemoLayout>;
}

export function QuasiFermiLevels() {
  const { v, set, reset } = useParams({ ND: 1e16, excess: 1e14, T: 300 });
  const [equilibrium, setEquilibrium] = useState(false);
  const setControl = (key: string, value: number) => { set(key, value); if (key === 'excess') setEquilibrium(false); };
  const excess = equilibrium ? 0 : v.excess;
  const r = P.quasiFermi(v.ND, excess, v.T);
  const intrinsic = P.ni(v.T);
  const minEnergy = Math.min(r.Ev, r.Fp) - .16, maxEnergy = Math.max(r.Ec, r.Fn) + .16;
  const logRange: [number, number] = [6, 18];
  const fnCurve = pts(6, 18, 120, x => P.quasiFermi(v.ND, 10 ** x, v.T).Fn);
  const fpCurve = pts(6, 18, 120, x => P.quasiFermi(v.ND, 10 ** x, v.T).Fp);
  const curveMin = Math.min(r.Ev - .1, ...fpCurve.map(point => point[1])) - .06;
  const curveMax = Math.max(r.Ec + .1, ...fnCurve.map(point => point[1])) + .06;
  const bandLine = (energy: number): [number, number][] => [[-1, energy], [1, energy]];
  return <DemoLayout calculation={<Calculation
    formula={'F_n-F_p=kT\\ln\\!\\left(\\frac{np}{n_i^2}\\right)'}
    substitution={fmt(P.thermalVoltage(v.T), 4) + '\\ln\\!\\left(\\frac{(' + texSci(r.n) + ')(' + texSci(r.p) + ')}{(' + texSci(intrinsic) + ')^2}\\right)=' + fmt(r.split, 4) + '\\,\\mathrm{eV}'} />}
    controls={<Controls values={v} set={setControl} reset={() => { reset(); setEquilibrium(false); }} items={[
      dopingControl('ND', 'Donor density'),
      { key: 'excess', label: 'Injected electron–hole pairs', min: 1e6, max: 1e18, step: 1e6, unit: 'cm⁻³', log: true },
      temperatureControl,
    ]}><Toggle label="Thermal equilibrium (Δn = Δp = 0)" checked={equilibrium} onChange={setEquilibrium} /></Controls>}>
    <Metrics><Metric label="Electrons n" value={sci(r.n)} unit="cm⁻³" /><Metric label="Holes p" value={sci(r.p)} unit="cm⁻³" /><Metric label="Electron level Fₙ" value={fmt(r.Fn, 3)} unit="eV from Eᵢ" /><Metric label="Hole level Fₚ" value={fmt(r.Fp, 3)} unit="eV from Eᵢ" /><Metric label="Level splitting" value={fmt(r.split, 3)} unit="eV" /></Metrics>
    {!r.boltzmannValid && <div className="notice">A quasi-Fermi level is within 3kT of a band edge. The exponential carrier formulas are outside their nondegenerate range.</div>}
    <div className="graph-grid">
      <Plot title="Energy bands and Fermi levels" xLabel="Position (relative)" yLabel="Energy (eV)" xDomain={[-1, 1]} yDomain={[minEnergy, maxEnergy]} series={[
        { name: 'Eᴄ', color: blue, points: bandLine(r.Ec) },
        { name: 'Eᵢ', color: '#ae7b16', points: bandLine(0), dash: true },
        { name: 'Eᴠ', color: green, points: bandLine(r.Ev) },
        ...(equilibrium ? [{ name: 'Eꜰ', color: purple, points: bandLine(r.equilibriumFermi) }] : [
          { name: 'Fₙ', color: blue, points: bandLine(r.Fn) },
          { name: 'Fₚ', color: orange, points: bandLine(r.Fp) },
        ]),
      ]} brackets={equilibrium ? [] : [{ x: .5, from: r.Fp, to: r.Fn, label: 'Fₙ−Fₚ ' + fmt(r.split, 3) + ' eV', color: purple }]} points={equilibrium ? [{ x: -.7, y: r.equilibriumFermi, label: 'Eꜰ ' + fmt(r.equilibriumFermi, 3) + ' eV', color: purple }] : []} onInspect={() => 'Eᴄ ' + fmt(r.Ec) + ' · Fₙ ' + fmt(r.Fn) + ' · Fₚ ' + fmt(r.Fp) + ' · Eᴠ ' + fmt(r.Ev) + ' eV'} />
      <Plot title="Level splitting with injection" xLabel="log₁₀ injected pairs (cm⁻³)" yLabel="Energy from Eᵢ (eV)" xDomain={logRange} yDomain={[curveMin, curveMax]} series={[
        { name: 'Fₙ', color: blue, points: fnCurve },
        { name: 'Fₚ', color: orange, points: fpCurve },
        { name: 'Equilibrium Eꜰ', color: purple, points: [[6, r.equilibriumFermi], [18, r.equilibriumFermi]], dash: true },
      ]} markers={equilibrium ? [] : [{ x: Math.log10(v.excess), label: 'Selected Δ ' + sci(v.excess) + ' cm⁻³' }]} points={equilibrium ? [] : [
        { x: Math.log10(v.excess), y: r.Fn, label: 'Fₙ ' + fmt(r.Fn, 3) + ' eV', color: blue },
        { x: Math.log10(v.excess), y: r.Fp, label: 'Fₚ ' + fmt(r.Fp, 3) + ' eV', color: orange },
      ]} onInspect={x => 'Fₙ ' + fmt(P.quasiFermi(v.ND, 10 ** x, v.T).Fn) + ' · Fₚ ' + fmt(P.quasiFermi(v.ND, 10 ** x, v.T).Fp) + ' eV'} />
    </div>
    <Info intuition="At equilibrium, one Fermi level describes electrons and holes. Injected electron–hole pairs disturb that balance, so each carrier population needs its own quasi-Fermi level." model="For nondegenerate carriers, Fₙ−Eᵢ = kT ln(n/nᵢ) and Eᵢ−Fₚ = kT ln(p/nᵢ). Pair injection adds the same excess density to n and p." takeaway="At equilibrium Fₙ = Fₚ. Their splitting measures how far the carrier populations are from equilibrium." derivation={['n=n_i e^{(F_n-E_i)/kT},\\qquad p=n_i e^{(E_i-F_p)/kT}', 'F_n-F_p=kT\\ln(np/n_i^2)', '\\Delta n=\\Delta p,\\qquad np>n_i^2\\;\\text{under injection}']} />
  </DemoLayout>;
}
