'use client';

import { useState } from 'react';
import katex from 'katex';
import Plot, { Series } from './Plot';
import { Controls, Control, Toggle } from './Controls';
import * as P from '../lib/physics';
const blue = '#2672d9',
  orange = '#d56138',
  green = '#14875f',
  purple = '#7654ba',
  yellow = '#ae7b16';
const pts = (a: number, b: number, n: number, fn: (x: number) => number): [number, number][] => Array.from({
  length: n + 1
}, (_, i) => {
  const x = a + (b - a) * i / n;
  return [x, fn(x)];
});
const sample = (data: [number, number][], x: number) => {let i=1;while(i<data.length-1&&data[i][0]<x)i++;const a=data[i-1],b=data[i],t=(x-a[0])/(b[0]-a[0]);return a[1]+t*(b[1]-a[1])};
const sci = (n: number, d = 2) => Number(n).toExponential(d);
const fmt = (n: number, d = 3) => Number(n).toFixed(d);
function MathLine({
  s
}: {
  s: string;
}) {
  return <div className="math" dangerouslySetInnerHTML={{
    __html: katex.renderToString(s, {
      throwOnError: false,
      displayMode: true
    })
  }} />;
}
function Info({
  intuition,
  model,
  takeaway,
  derivation
}: {
  intuition: string;
  model: string;
  takeaway: string;
  derivation: string[];
}) {
  return <div className="learning-block">
    <p className="takeaway"><span>Takeaway</span>{takeaway}</p>
    <details className="derivation">
      <summary>Explanation and derivation <span>+</span></summary>
      <div className="info-grid">
        <div><span>Physical intuition</span><p>{intuition}</p></div>
        <div><span>Model</span><p>{model}</p></div>
      </div>
      {derivation.map((equation, index) => <MathLine key={index} s={equation} />)}
    </details>
  </div>;
}
function Metric({
  label,
  value,
  unit
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{unit}</small></div>;
}
function Metrics({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="metrics">{children}</div>;
}
function ChipGroup({
  items,
  value,
  set
}: {
  items: {
    value: string;
    label: string;
  }[];
  value: string;
  set: (s: string) => void;
}) {
  return <div className="chips">{items.map(i => <button key={i.value} className={value === i.value ? 'active' : ''} onClick={() => set(i.value)}>{i.label}</button>)}</div>;
}
function ErrorBox({
  error
}: {
  error: unknown;
}) {
  return <div className="error-box">{error instanceof Error ? error.message : String(error)}</div>;
}
function useParams(initial: Record<string, number>) {
  const [v, setV] = useState(initial);
  return {
    v,
    set: (key: string, value: number) => setV(old => ({
      ...old,
      [key]: value
    })),
    reset: () => setV(initial)
  };
}
const dopControls: Control[] = [{
  key: 'NA0',
  label: 'Surface acceptors',
  min: 1e15,
  max: 1e19,
  step: 1e14,
  unit: 'cm⁻³',
  log: true
}, {
  key: 'ND',
  label: 'Donors',
  min: 1e14,
  max: 1e18,
  step: 1e13,
  unit: 'cm⁻³',
  log: true
}, {
  key: 'L',
  label: 'Diffusion length',
  min: .1,
  max: 3,
  step: .01,
  unit: 'µm'
}];
export function Doping() {
  const {
    v,
    set,
    reset
  } = useParams({
    NA0: 1e18,
    ND: 1e16,
    L: 1
  });
  const curves = true, junction = true, log = true;
  try {
    const xj = P.junctionPosition(v.NA0, v.ND, v.L),
      max = 5,
      jd = xj >= 0 && xj <= max;
    const a = pts(0, max, 120, x => P.doping(v.NA0, v.ND, v.L, x).NA),
      d = pts(0, max, 120, () => v.ND),
      net = pts(0, max, 120, x => P.doping(v.NA0, v.ND, v.L, x).net / 1e18);
    const transform = (arr: [number, number][]) => arr.map(([x, y]) => ([x, log ? Math.log10(y) : y / 1e18] as [number, number]));
    const low = log ? Math.floor(Math.log10(Math.min(v.ND, v.NA0 * Math.exp(-max / v.L)))) : 0,
      high = log ? Math.ceil(Math.log10(Math.max(v.NA0, v.ND))) : Math.max(v.NA0, v.ND) / 1e18 * 1.05;
    return <DemoLayout controls={<Controls values={v} set={set} items={dopControls} reset={reset}></Controls>}><Metrics><Metric label="Metallurgical junction" value={jd ? fmt(xj, 2) : 'Outside bar'} unit={jd ? 'µm' : ''} /><Metric label="P-type length" value={fmt(Math.max(0, Math.min(max, xj)), 2)} unit="µm" /><Metric label="N-type length" value={fmt(max - Math.max(0, Math.min(max, xj)), 2)} unit="µm" /></Metrics><div className="silicon-bar"><div style={{
          width: `${100 * Math.max(0, Math.min(max, xj)) / max}%`
        }} className="pbar">P-TYPE</div><div className="nbar">N-TYPE</div></div><div className="graph-grid"><Plot title="Individual doping concentrations" yLabel={log ? 'log₁₀ concentration (cm⁻³)' : 'Concentration (10¹⁸ cm⁻³)'} series={curves ? [{
          name: 'Nₐ',
          color: orange,
          points: transform(a)
        }, {
          name: 'Nᴅ',
          color: blue,
          points: transform(d)
        }] : []} xDomain={[0, max]} yDomain={[low, high]} markers={junction && jd ? [{
          x: xj,
          label: 'Metallurgical junction'
        }] : []} onInspect={x => {
          const r = P.doping(v.NA0, v.ND, v.L, x);
          return `Nₐ ${sci(r.NA)} · Nᴅ ${sci(r.ND)} cm⁻³`;
        }} /><Plot title="Net dopant concentration" yLabel="Nᴅ − Nₐ (10¹⁸ cm⁻³)" series={[{
          name: 'Nᴅ − Nₐ',
          color: purple,
          points: net
        }]} xDomain={[0, max]} yDomain={[-v.NA0 / 1e18 * 1.05, Math.max(v.ND / 1e18, .05)]} zones={[{
          from: 0,
          to: Math.max(0, Math.min(max, xj)),
          color: orange
        }, {
          from: Math.max(0, Math.min(max, xj)),
          to: max,
          color: blue
        }]} markers={junction && jd ? [{
          x: xj,
          label: 'Junction'
        }] : []} onInspect={x => {
          const r = P.doping(v.NA0, v.ND, v.L, x);
          return `Net ${sci(r.net)} cm⁻³ · ${r.type}`;
        }} /></div><Info intuition="Diffused acceptors dominate near the surface. Farther into the bar, the constant donor background wins." model="The junction is the position where ionized donor and acceptor concentrations are equal." takeaway="Increasing acceptors moves the junction right; increasing donors moves it left." derivation={['N_A(x)=N_{A0}e^{-x/L},\\qquad N_D(x)=N_{D0}', 'N_A(x_j)=N_D\\quad\\Rightarrow\\quad x_j=L\\ln(N_{A0}/N_D)']} /></DemoLayout>;
  } catch (e) {
    return <ErrorBox error={e} />;
  }
}
function DemoLayout({
  controls,
  children
}: {
  controls: React.ReactNode;
  children: React.ReactNode;
}) {
  return <div className="demo-layout"><div className="demo-main">{children}</div>{controls}</div>;
}
const pnControls: Control[] = [{
  key: 'NA',
  label: 'P-side acceptors',
  min: 1e15,
  max: 1e19,
  step: 1e14,
  unit: 'cm⁻³',
  log: true
}, {
  key: 'ND',
  label: 'N-side donors',
  min: 1e15,
  max: 1e19,
  step: 1e14,
  unit: 'cm⁻³',
  log: true
}, {
  key: 'VA',
  label: 'Applied voltage',
  min: -2,
  max: .7,
  step: .01,
  unit: 'V'
}, {
  key: 'T',
  label: 'Temperature',
  min: 200,
  max: 450,
  step: 1,
  unit: 'K'
}];
export function PNDepletion() {
  const {
    v,
    set,
    reset
  } = useParams({
    NA: 1e17,
    ND: 1e16,
    VA: 0,
    T: 300
  });
  const car = true, ions = true, animate = false;
  try {
    const d = P.pnDepletion(v.NA, v.ND, v.T, v.VA),
      a = -d.xp * 1.35,
      b = d.xn * 1.35;
    const f = (x: number) => P.pnFields(x, v.NA, v.ND, v.T, v.VA);
    const xpts = pts(a, b, 240, x => x);
    const conv = (fn: (x: number) => number) => xpts.map(([x]) => ([P.um(x), fn(x)] as [number, number]));
    return <DemoLayout controls={<Controls values={v} set={set} items={pnControls} reset={reset}></Controls>}><Metrics><Metric label="Total width W" value={fmt(P.um(d.W), 3)} unit="µm" /><Metric label="P-side xₚ" value={fmt(P.um(d.xp), 3)} unit="µm" /><Metric label="N-side xₙ" value={fmt(P.um(d.xn), 3)} unit="µm" /><Metric label="Peak |E|" value={sci(d.Emax)} unit="V/cm" /><Metric label="Built-in V" value={fmt(d.vbi)} unit="V" /></Metrics><div className={`junction-bar ${animate ? 'animating' : ''}`}><div className="p-half">P REGION {car && <span className="carriers">○ ○ ○ ○</span>}</div><div className="depletion-slice" style={{
          left: `${100 * (-d.xp - a) / (b - a)}%`,
          width: `${100 * d.W / (b - a)}%`
        }}>{ions && <span>− − − │ + + +</span>}<small>DEPLETION</small></div><div className="n-half">{car && <span className="carriers">• • • •</span>} N REGION</div></div><div className="graph-grid three"><Plot title="Space charge density" yLabel="ρ (C/cm³)" xDomain={[P.um(a), P.um(b)]} yDomain={[-v.NA * P.q * 1.1, v.ND * P.q * 1.1]} series={[{
          name: 'ρ(x)',
          color: orange,
          points: conv(x => f(x).rho)
        }]} markers={[{
          x: 0,
          label: 'Junction'
        }]} /><Plot title="Electric field" yLabel="E (V/cm)" xDomain={[P.um(a), P.um(b)]} yDomain={[-d.Emax * 1.1, d.Emax * .1]} series={[{
          name: 'E(x)',
          color: blue,
          points: conv(x => f(x).E)
        }]} /><Plot title="Electrostatic potential" yLabel="V (V)" xDomain={[P.um(a), P.um(b)]} yDomain={[0, d.drop * 1.1]} series={[{
          name: 'V(x)',
          color: green,
          points: conv(x => f(x).V)
        }]} /></div><Info intuition="Diffusing carriers leave fixed ions near the interface. The resulting electric field opposes further diffusion." model="Charge neutrality sets the side widths; Poisson's equation determines the electric field and potential." takeaway="The depletion region reaches farther into the more lightly doped side. Forward bias narrows it." derivation={['N_Ax_p=N_Dx_n,\\qquad W=x_p+x_n', 'W=\\sqrt{\\frac{2\\varepsilon_s}{q}\\left(\\frac1{N_A}+\\frac1{N_D}\\right)(V_{bi}-V_A)}', 'E_{max}=\\frac{qN_Ax_p}{\\varepsilon_s}=\\frac{qN_Dx_n}{\\varepsilon_s}']} /></DemoLayout>;
  } catch (e) {
    return <DemoLayout controls={<Controls values={v} set={set} items={pnControls} reset={reset} />}><ErrorBox error={e} /></DemoLayout>;
  }
}
export function JunctionModels() {
  const {
    v,
    set,
    reset
  } = useParams({
    NA: 1e17,
    ND: 1e17,
    a: 1e18
  });
  const [model, M] = useState('both');
  const smooth = false, ideal = true;
  const x = pts(-1, 1, 200, z => z),
    abrupt = x.map(([z]) => ([z, z < 0 ? -v.NA / 1e17 : v.ND / 1e17] as [number, number])),
    graded = x.map(([z]) => ([z, v.a * z / 1e18] as [number, number])),
    actual = x.map(([z]) => ([z, (v.ND + v.NA) / 2e17 * Math.tanh(z / .09) + (v.ND - v.NA) / 2e17] as [number, number]));
  const series: Series[] = [...(ideal && model !== 'graded' ? [{
    name: 'Abrupt',
    color: orange,
    points: abrupt
  }] : []), ...(ideal && model !== 'abrupt' ? [{
    name: 'Graded',
    color: blue,
    points: graded
  }] : []), ...(smooth ? [{
    name: 'Smooth transition',
    color: purple,
    points: actual,
    dash: true
  }] : [])];
  return <DemoLayout controls={<Controls values={v} set={set} items={[{
    key: 'NA',
    label: 'Acceptor density',
    min: 1e15,
    max: 1e18,
    step: 1e15,
    unit: 'cm⁻³',
    log: true
  }, {
    key: 'ND',
    label: 'Donor density',
    min: 1e15,
    max: 1e18,
    step: 1e15,
    unit: 'cm⁻³',
    log: true
  }, {
    key: 'a',
    label: 'Doping gradient',
    min: 1e17,
    max: 5e18,
    step: 1e17,
    unit: 'cm⁻³/µm',
    log: true
  }]} reset={reset}><ChipGroup items={[{
      value: 'abrupt',
      label: 'Abrupt'
    }, {
      value: 'graded',
      label: 'Graded'
    }, {
      value: 'both',
      label: 'Overlay'
    }]} value={model} set={M} /></Controls>}><div className="graph-grid"><Plot title="Net dopant concentration" yLabel="Nᴅ − Nₐ (10¹⁷ cm⁻³)" xDomain={[-1, 1]} yDomain={[-Math.max(v.NA / 1e17, v.a / 1e18) * 1.2, Math.max(v.ND / 1e17, v.a / 1e18) * 1.2]} series={series} markers={[{
        x: 0,
        label: 'Junction'
      }]} /><Plot title="Depletion-region charge" yLabel="ρ/q (10¹⁷ cm⁻³)" xDomain={[-1, 1]} yDomain={[-Math.max(v.NA / 1e17, v.a / 1e18) * 1.2, Math.max(v.ND / 1e17, v.a / 1e18) * 1.2]} series={series.map(s => ({
        ...s,
        points: s.points.map(([z, y]) => [z, Math.abs(z) < .65 ? y : 0])
      }))} markers={[{
        x: 0,
        label: 'Junction'
      }]} /></div><div className="graph-grid"><Plot title="Electric-field shape" yLabel="Normalized E" xDomain={[-1, 1]} yDomain={[-1.1, .1]} series={[...(model !== 'graded' ? [{
        name: 'Abrupt: triangular',
        color: orange,
        points: x.map(([z]) => ([z, Math.abs(z) < .65 ? -(1 - Math.abs(z) / .65) : 0] as [number, number]))
      }] : []), ...(model !== 'abrupt' ? [{
        name: 'Graded: parabolic',
        color: blue,
        points: x.map(([z]) => ([z, Math.abs(z) < .65 ? -(1 - (z / .65) ** 2) : 0] as [number, number]))
      }] : [])]} /></div><Info intuition="An abrupt junction changes dopant type sharply. A graded junction crosses through zero gradually." model="Within depletion, fixed ionized dopants set ρ ≈ q(Nᴅ−Nₐ). Neutral regions contain compensating mobile carriers, so their net charge is near zero." takeaway="Abrupt charge makes a triangular field; linear charge makes a parabolic field." derivation={['\\rho(x)\\approx q(N_D-N_A)\\quad\\text{inside depletion}', '\\frac{d\\mathcal E}{dx}=\\frac{\\rho}{\\varepsilon_s}', '\\rho\\propto x\\quad\\Rightarrow\\quad \\mathcal E\\propto x^2']} /></DemoLayout>;
}
function Band({
  title,
  ec,
  ev,
  ef = 0,
  ei,
  xDomain = [-1, 1],
  markers = []
}: {
  title: string;
  ec: [number, number][];
  ev: [number, number][];
  ef?: number;
  ei?: [number, number][];
  xDomain?: [number, number];
  markers?: {
    x: number;
    label: string;
  }[];
}) {
  const all = [...ec, ...ev].map(p => p[1]);
  return <Plot title={title} xLabel="Position (relative)" yLabel="Energy (eV)" xDomain={xDomain} yDomain={[Math.min(...all, ef) - .12, Math.max(...all, ef) + .12]} markers={markers} series={[{
    name: 'Eᴄ',
    color: blue,
    points: ec
  }, {
    name: 'Eᴠ',
    color: green,
    points: ev
  }, ...(ei ? [{
    name: 'Eᵢ',
    color: yellow,
    points: ei,
    dash: true
  }] : []), {
    name: 'Eꜰ',
    color: purple,
    points: [[xDomain[0], ef], [xDomain[1], ef]]
  }]} onInspect={x=>`Eᴄ ${fmt(sample(ec,x))} · Eᴠ ${fmt(sample(ev,x))} · Eꜰ ${fmt(ef)} eV`} />;
}
const bandControls: Control[] = [{
  key: 'NA',
  label: 'Acceptor density',
  min: 1e15,
  max: 1e19,
  step: 1e14,
  unit: 'cm⁻³',
  log: true
}, {
  key: 'ND',
  label: 'Donor density',
  min: 1e15,
  max: 1e19,
  step: 1e14,
  unit: 'cm⁻³',
  log: true
}, {
  key: 'T',
  label: 'Temperature',
  min: 200,
  max: 450,
  step: 1,
  unit: 'K'
}];
export function BuiltIn() {
  const {
    v,
    set,
    reset
  } = useParams({
    NA: 1e17,
    ND: 1e16,
    T: 300
  });
  const [contact, C] = useState(true);
  const show = true;
  try {
    const V = P.builtIn(v.NA, v.ND, v.T),
      Eg = P.bandgap(v.T),
      kT = P.thermalVoltage(v.T),
      ni = P.ni(v.T);
    const left = kT * Math.log(v.NA / ni),
      right = kT * Math.log(v.ND / ni);
    const bend = pts(-1, 1, 120, x => V * (1 - (1 + Math.tanh(x * 3)) / 2));
    const ec = bend.map(([x, y]) => ([x, y + Eg / 2 - right] as [number, number])),
      ev = ec.map(([x, y]) => ([x, y - Eg] as [number, number])),
      ei = ec.map(([x, y]) => ([x, y - Eg / 2] as [number, number]));
    return <DemoLayout controls={<Controls values={v} set={set} items={bandControls} reset={reset}><Toggle label="After contact / equilibrium" checked={contact} onChange={C} /></Controls>}><Metrics><Metric label="Built-in potential" value={fmt(V)} unit="V" /><Metric label="Thermal voltage" value={fmt(kT, 4)} unit="V" /><Metric label="Intrinsic density" value={sci(ni)} unit="cm⁻³" /><Metric label="Bandgap" value={fmt(Eg)} unit="eV" /></Metrics>{contact ? <Band title="Equilibrium PN energy bands" ec={ec} ev={ev} ei={ei} markers={show ? [{
        x: 0,
        label: `qVbi = ${fmt(V)} eV`
      }] : []} /> : <div className="graph-grid"><Band title="Separate p-type bulk" ec={[[-1, Eg / 2 + left], [1, Eg / 2 + left]]} ev={[[-1, -Eg / 2 + left], [1, -Eg / 2 + left]]} ei={[[-1, left], [1, left]]} /><Band title="Separate n-type bulk" ec={[[-1, Eg / 2 - right], [1, Eg / 2 - right]]} ev={[[-1, -Eg / 2 - right], [1, -Eg / 2 - right]]} ei={[[-1, -right], [1, -right]]} /></div>}<Info intuition="Carrier diffusion at contact creates a space-charge field. Equilibrium requires a flat Fermi level." model="The bulk Fermi-level offsets on each side add to the built-in energy." takeaway="More doping increases band bending logarithmically, while the equilibrium Fermi level stays flat." derivation={['(E_i-E_F)_p=kT\\ln(N_A/n_i)', '(E_F-E_i)_n=kT\\ln(N_D/n_i)', 'qV_{bi}=kT\\ln\\!\\left(\\frac{N_AN_D}{n_i^2}\\right)']} /></DemoLayout>;
  } catch (e) {
    return <ErrorBox error={e} />;
  }
}
export function Degenerate() {
  const {
    v,
    set,
    reset
  } = useParams({
    N: 1e18,
    T: 300
  });
  const [type, S] = useState('n');
  const bands = true, intrinsic = true;
  try {
    const r = P.fermiOffset((type as 'n' | 'p'), v.N, v.T),
      Eg = P.bandgap(v.T),
      edge = type === 'n' ? Eg / 2 : -Eg / 2,
      EF = type === 'n' ? edge + r.edge : edge - r.edge;
    return <DemoLayout controls={<Controls values={v} set={set} items={[{
      key: 'N',
      label: 'Dopant density',
      min: 1e15,
      max: 1e21,
      step: 1e15,
      unit: 'cm⁻³',
      log: true
    }, {
      key: 'T',
      label: 'Temperature',
      min: 200,
      max: 450,
      step: 1,
      unit: 'K'
    }]} reset={reset}><ChipGroup items={[{
        value: 'n',
        label: 'N-type'
      }, {
        value: 'p',
        label: 'P-type'
      }]} value={type} set={S} /></Controls>}><Metrics><Metric label="Fermi-to-band edge" value={fmt(r.edge, 3)} unit="eV (positive = in band)" /><Metric label="Reduced Fermi level η" value={fmt(r.eta, 2)} /><Metric label="Statistics" value={r.degenerate ? 'Degenerate' : r.boltzmannValid ? 'Boltzmann valid' : 'Transition'} /></Metrics>{!r.boltzmannValid && <div className="notice">Boltzmann statistics become inaccurate within about 3kT of a band edge. Values here use numerical Fermi–Dirac statistics.</div>}{bands && <Band title={`${type.toUpperCase()}-type silicon energy bands`} ec={[[-1, Eg / 2], [1, Eg / 2]]} ev={[[-1, -Eg / 2], [1, -Eg / 2]]} ei={intrinsic ? [[-1, 0], [1, 0]] : undefined} ef={EF} />}<div className="comparison"><div><b>Boltzmann approximation</b><p>Assumes the Fermi level is several kT away from a band edge. Carrier density is exponential in energy.</p></div><div><b>Fermi–Dirac statistics</b><p>Accounts for occupancy limits near and inside a band. Used for the displayed Fermi-level result.</p></div></div><Info intuition="Adding dopants raises electron or hole density and pushes the Fermi level toward its nearby band." model="Carrier density is NᴄF₁/₂(η) or NᴠF₁/₂(η), solved numerically for η." takeaway="When η ≥ 0, the Fermi level enters an allowed band and the doping is degenerate." derivation={['n=N_CF_{1/2}((E_F-E_C)/kT)', 'p=N_VF_{1/2}((E_V-E_F)/kT)', 'F_{1/2}(\\eta)=\\frac{2}{\\sqrt\\pi}\\int_0^\\infty\\frac{\\sqrt{u}}{1+e^{u-\\eta}}\\,du']} /></DemoLayout>;
  } catch (e) {
    return <ErrorBox error={e} />;
  }
}
export function DegenerateJunctions() {
  const {
    v,
    set,
    reset
  } = useParams({
    N: 1e17,
    Eg: 1.124,
    T: 300
  });
  const [mode, M] = useState('pn'),
    [advanced, A] = useState(false);
  try {
    const kT = P.thermalVoltage(v.T),
      ni = Math.sqrt(P.Nc(v.T) * P.Nv(v.T)) * Math.exp(-v.Eg / (2 * kT));
    const ordinary = kT * Math.log(v.N * v.N / ni ** 2);
    const approx = v.Eg / 2 + kT * Math.log(v.N / ni);
    const adv = P.advancedJunction(mode === 'p+n' ? 1e20 : v.N, mode === 'n+p' ? 1e20 : v.N, v.T).vbi + (v.Eg - P.bandgap(v.T));
    const V = mode === 'pn' ? ordinary : advanced ? adv : approx;
    const ec = pts(-1, 1, 100, x => v.Eg / 2 + V * (1 - Math.tanh(x * 3)) / 2),
      ev = ec.map(([x, y]) => ([x, y - v.Eg] as [number, number]));
    return <DemoLayout controls={<Controls values={v} set={set} items={[{
      key: 'N',
      label: 'Nondegenerate-side doping',
      min: 1e15,
      max: 1e19,
      step: 1e14,
      unit: 'cm⁻³',
      log: true
    }, {
      key: 'Eg',
      label: 'Bandgap',
      min: .8,
      max: 1.5,
      step: .001,
      unit: 'eV'
    }, {
      key: 'T',
      label: 'Temperature',
      min: 200,
      max: 450,
      step: 1,
      unit: 'K'
    }]} reset={reset}><ChipGroup items={[{
        value: 'pn',
        label: 'Ordinary PN'
      }, {
        value: 'p+n',
        label: 'P⁺N'
      }, {
        value: 'n+p',
        label: 'N⁺P'
      }]} value={mode} set={M} /><Toggle label="Advanced Fermi–Dirac result" checked={advanced} onChange={A} /></Controls>}><Metrics><Metric label="Built-in voltage" value={fmt(V, 3)} unit="V" /><Metric label="Model" value={mode === 'pn' ? 'Boltzmann' : advanced ? 'Fermi–Dirac' : 'Band-edge approximation'} /></Metrics><Band title="Junction energy-band comparison" ec={ec} ev={ev} markers={[{
        x: 0,
        label: `qVbi ${fmt(V)} eV`
      }]} />{mode !== 'pn' && !advanced && <div className="notice">Approximation: intrinsic level at midgap and heavily doped-side Fermi level exactly at the band edge. Arbitrary degenerate doping needs Fermi–Dirac statistics.</div>}<Info intuition="A heavily doped side pulls its Fermi level close to or inside a band, changing the contact potential." model="The simple Eɢ/2 expressions pin the Fermi level at a band edge; the advanced option solves carrier statistics numerically with a nominal 10²⁰ cm⁻³ heavy side." takeaway="Band-edge formulas are teaching approximations, not universal degenerate-junction formulas." derivation={['qV_{bi}=E_G/2+kT\\ln(N_D/n_i)\\quad(p^+n)', 'qV_{bi}=E_G/2+kT\\ln(N_A/n_i)\\quad(n^+p)', 'qV_{bi}=E_G+(E_F-E_C)_n+(E_V-E_F)_p']} /></DemoLayout>;
  } catch (e) {
    return <ErrorBox error={e} />;
  }
}
function SchottkyBand({
  title,
  phi,
  drop,
  VA,
  T = 300,
  p = false
}: {
  title: string;
  phi: number;
  drop: number;
  VA: number;
  T?: number;
  p?: boolean;
}) {
  const Eg = P.bandgap(T);
  const bend = pts(0, 1, 100, x => drop * Math.exp(-5 * x));
  const ec = bend.map(([x, y]) => ([x, p ? Eg - phi - VA + drop - y : phi - VA - drop + y] as [number, number])),
    ev = ec.map(([x, y]) => ([x, y - Eg] as [number, number]));
  const all = [...ec, ...ev].map(d => d[1]);
  return <Plot title={title} xLabel="Metal │ semiconductor position" yLabel="Energy (eV)" xDomain={[-.25, 1]} yDomain={[Math.min(...all, -VA, 0) - .2, Math.max(...all, -VA, 0) + .2]} markers={[{
    x: 0,
    label: 'Interface'
  }]} series={[{
    name: 'Eᴄ',
    color: blue,
    points: ec
  }, {
    name: 'Eᴠ',
    color: green,
    points: ev
  }, {
    name: 'Metal Eꜰ',
    color: purple,
    points: [[-.25, -VA], [0, -VA]]
  }, {
    name: 'Semiconductor Eꜰ',
    color: yellow,
    points: [[0, 0], [1, 0]]
  }]} onInspect={x=>x<0?`Metal Eꜰ ${fmt(-VA)} eV`:`Eᴄ ${fmt(sample(ec,x))} · Eᴠ ${fmt(sample(ev,x))} eV`} />;
}
const schControls: Control[] = [{
  key: 'ND',
  label: 'Donor density',
  min: 1e15,
  max: 1e19,
  step: 1e14,
  unit: 'cm⁻³',
  log: true
}, {
  key: 'phiM',
  label: 'Metal work function',
  min: 4,
  max: 5.6,
  step: .01,
  unit: 'eV'
}, {
  key: 'chi',
  label: 'Electron affinity',
  min: 3.8,
  max: 4.3,
  step: .01,
  unit: 'eV'
}, {
  key: 'phiEmp',
  label: 'Empirical barrier',
  min: .35,
  max: 1,
  step: .01,
  unit: 'eV'
}, {
  key: 'VA',
  label: 'Applied voltage',
  min: -2,
  max: .6,
  step: .01,
  unit: 'V'
}, {
  key: 'T',
  label: 'Temperature',
  min: 200,
  max: 450,
  step: 1,
  unit: 'K'
}];
export function Schottky() {
  const {
    v,
    set,
    reset
  } = useParams({
    ND: 1e17,
    phiM: 4.8,
    chi: 4.05,
    phiEmp: .67,
    VA: 0,
    T: 300
  });
  const [mode, M] = useState('empirical');
  const [metal, setMetal] = useState('NiSi');
  try {
    const phi = mode === 'ideal' ? v.phiM - v.chi : v.phiEmp,
      d = P.schottky(phi, v.ND, v.T, v.VA);
    return <DemoLayout controls={<Controls values={v} set={set} items={schControls.filter(control => mode === 'ideal' ? ['ND','phiM','chi','VA'].includes(control.key) : ['ND','phiEmp','VA'].includes(control.key))} reset={reset}><label className="select-label">Contact material<select value={metal} onChange={e => {const selected=e.target.value;setMetal(selected);set('phiM',selected==='Al'?4.28:selected==='Au'?5.10:4.80);if(selected!=='NiSi')M('ideal')}}><option value="NiSi">NiSi / Si</option><option value="Al">Al / Si (ideal)</option><option value="Au">Au / Si (ideal)</option></select></label><ChipGroup items={metal==='NiSi'?[{
        value: 'empirical',
        label: 'Empirical barrier'
      }, {
        value: 'ideal',
        label: 'Ideal Schottky–Mott'
      }]:[{value:'ideal',label:'Ideal Schottky–Mott'}]} value={mode} set={M} /></Controls>}><Metrics><Metric label="Electron barrier ΦBn" value={fmt(phi)} unit="eV" /><Metric label="Built-in potential" value={fmt(d.vbi)} unit="V" /><Metric label="Depletion drop" value={fmt(d.drop)} unit="V" /><Metric label="Effective electron barrier" value={fmt(phi-v.VA)} unit="eV from semiconductor Eꜰ" /><Metric label="Depletion width" value={fmt(P.um(d.W), 3)} unit="µm" /></Metrics><SchottkyBand title="Metal / n-Si energy bands" phi={phi} drop={d.drop} VA={v.VA} T={v.T} /><div className="notice">Ideal mode uses ΦBn = ΦM − χ. The 0.67 eV NiSi/n-Si default follows a measured thermionic-emission result; real barriers depend on interface preparation and measurement. Bias changes band bending, while the idealized interface barrier remains fixed. <a href="https://doi.org/10.1016/S0038-1101(03)00286-7" target="_blank" rel="noreferrer">NiSi/n-Si measurement ?</a></div><Info intuition="Electrons see an interface barrier. Ionized donors in silicon create a depletion region and band bending." model="Barrier height sets interface energetics; subtracting the semiconductor Fermi-to-conduction-band offset gives built-in voltage." takeaway="Barrier height, built-in voltage, and the bias-dependent depletion drop are different quantities." derivation={['\\Phi_{Bn}=\\Phi_M-\\chi', 'V_{bi}=\\Phi_{Bn}-\\frac{kT}{q}\\ln(N_C/N_D)', 'W=\\sqrt{2\\varepsilon_s(V_{bi}-V_A)/(qN_D)}']} /></DemoLayout>;
  } catch (e) {
    return <ErrorBox error={e} />;
  }
}
export function SchottkyBias() {
  const {
    v,
    set,
    reset
  } = useParams({
    phiN: .67,
    phiP: .45
  });
  const [selected, S] = useState([true, true, true, true]);
  const cases = [{
    name: 'NiSi / n-Si · equilibrium',
    VA: 0,
    p: false
  }, {
    name: 'NiSi / n-Si · reverse',
    VA: -1,
    p: false
  }, {
    name: 'NiSi / n-Si · forward',
    VA: .2,
    p: false
  }, {
    name: 'NiSi / p-Si · equilibrium',
    VA: 0,
    p: true
  }];
  const rows = cases.map((c, i) => {
    try {
      const d = c.p ? P.schottkyP(v.phiP, 1e17, 300, 12 * 8.85e-14) : P.schottky(v.phiN, 1e17, 300, c.VA, 12 * 8.85e-14);
      return {
        ...c,
        index: i,
        phi: c.p ? v.phiP : v.phiN,
        ...d
      };
    } catch (e) {
      return {
        ...c,
        index: i,
        phi: c.p ? v.phiP : v.phiN,
        error: e instanceof Error ? e.message : String(e)
      };
    }
  });
  return <DemoLayout controls={<Controls values={v} set={set} items={[{
    key: 'phiN',
    label: 'NiSi / n-Si reference barrier',
    min: .4,
    max: .9,
    step: .01,
    unit: 'eV'
  }, {
    key: 'phiP',
    label: 'NiSi / p-Si reference barrier',
    min: .2,
    max: .8,
    step: .01,
    unit: 'eV'
  }]} reset={reset}><div className="case-select">{cases.map((c, i) => <Toggle key={i} label={`Case ${i + 1}`} checked={selected[i]} onChange={checked => S(old => old.map((x, j) => j === i ? checked : x))} />)}</div></Controls>}><div className="notice">Teaching reference: ΦBn = 0.67 eV, ΦBp = 0.45 eV for NiSi/Si. Adjustable values represent interface-dependent empirical barriers (<a href="https://doi.org/10.1016/S0038-1101(03)00286-7" target="_blank" rel="noreferrer">n-Si study</a>; <a href="https://avesis.uludag.edu.tr/yayin/c1235786-676b-42d1-acf7-6ceafb248039/temperature-dependent-electrical-behavior-of-nickel-silicide-schottky-diodes-on-p-type-silicon" target="_blank" rel="noreferrer">p-Si study</a>). T = 300 K; εs = 12 × 8.85 × 10⁻¹⁴ F/cm; dopant density = 10¹⁷ cm⁻³.</div><div className="graph-grid">{rows.filter(r => selected[r.index]).map(r => 'error' in r ? <ErrorBox key={r.index} error={r.error} /> : <SchottkyBand key={r.index} title={r.name} phi={r.phi} drop={r.drop} VA={r.VA} p={r.p} />)}</div><div className="table-wrap"><table><thead><tr><th>Case</th><th>Vₐ (V)</th><th>Barrier (eV)</th><th>Vbi (V)</th><th>Drop (V)</th><th>W (µm)</th></tr></thead><tbody>{rows.filter(r => selected[r.index]).map(r => <tr key={r.index}><td>{r.name}</td><td>{r.VA}</td><td>{fmt(r.phi)}</td><td>{'error' in r ? '—' : fmt(r.vbi)}</td><td>{'error' in r ? '—' : fmt(r.drop)}</td><td>{'error' in r ? '—' : fmt(P.um(r.W))}</td></tr>)}</tbody></table></div><Info intuition="Reverse bias increases n-side band bending and depletion width; forward bias reduces both. P-side depletion bends the bands in the opposite direction." model="The contact barrier is fixed in this idealized model, while the semiconductor depletion drop is Vbi − Vₐ for n-type." takeaway="Biased diagrams require distinct metal and semiconductor electrochemical potentials." derivation={['W_n=\\sqrt{2\\varepsilon_s(V_{bi}-V_A)/(qN_D)}', 'W_p=\\sqrt{2\\varepsilon_sV_{bi,p}/(qN_A)}', '\\Phi_{Bp}\\approx E_G-\\Phi_{Bn}\\quad\\text{only for the same ideal interface}']} /></DemoLayout>;
}
export function Capacitance() {
  const {
    v,
    set,
    reset
  } = useParams({
    ND: 1e17,
    A: 1e-4,
    vbi: .6,
    VA: -.5,
    eps: 12
  });
  try {
    const epsilon = v.eps * P.eps0,
      now = P.capacitance(v.ND, v.A, v.vbi, v.VA, epsilon);
    const max = Math.min(v.vbi - .02, .55),
      min = -3,
      xs = pts(min, max, 150, x => x);
    const width = xs.map(([x]) => ([x, P.um(P.capacitance(v.ND, v.A, v.vbi, x, epsilon).W)] as [number, number]));
    const caps = xs.map(([x]) => ([x, P.capacitance(v.ND, v.A, v.vbi, x, epsilon).C * 1e12] as [number, number]));
    const inv = xs.map(([x]) => ([x, P.capacitance(v.ND, v.A, v.vbi, x, epsilon).invC2 / 1e24] as [number, number]));
    return <DemoLayout controls={<Controls values={v} set={set} items={[{
      key: 'ND',
      label: 'Donor density',
      min: 1e15,
      max: 1e19,
      step: 1e14,
      unit: 'cm⁻³',
      log: true
    }, {
      key: 'A',
      label: 'Junction area',
      min: 1e-6,
      max: 1e-2,
      step: 1e-6,
      unit: 'cm²',
      log: true
    }, {
      key: 'VA',
      label: 'Applied voltage',
      min: -3,
      max: .55,
      step: .01,
      unit: 'V'
    }, {
      key: 'vbi',
      label: 'Built-in voltage',
      min: .2,
      max: 1,
      step: .01,
      unit: 'V'
    }, {
      key: 'eps',
      label: 'Relative permittivity',
      min: 8,
      max: 16,
      step: .1,
      unit: 'ε₀'
    }].filter(control => control.key !== 'eps')} reset={reset}><div className="notice small">Depletion capacitance only. Diffusion capacitance and strong forward bias are excluded.</div></Controls>}><Metrics><Metric label="Depletion width" value={fmt(P.um(now.W), 3)} unit="µm" /><Metric label="Junction capacitance" value={fmt(now.C * 1e12, 2)} unit="pF" /><Metric label="1/C² slope" value={sci(now.slope)} unit="F⁻²/V" /><Metric label="Voltage intercept" value={fmt(now.intercept)} unit="V" /></Metrics><div className="graph-grid three"><Plot title="Depletion width" xLabel="Applied voltage (V)" yLabel="W (µm)" xDomain={[min, max]} yDomain={[0, width[0][1] * 1.1]} series={[{
          name: 'W',
          color: blue,
          points: width
        }]} markers={[{
          x: v.VA,
          label: 'Selected bias'
        }]} /><Plot title="Junction capacitance" xLabel="Applied voltage (V)" yLabel="C (pF)" xDomain={[min, max]} yDomain={[0, caps[caps.length - 1][1] * 1.1]} series={[{
          name: 'C',
          color: green,
          points: caps
        }]} markers={[{
          x: v.VA,
          label: 'Selected bias'
        }]} /><Plot title="Inverse capacitance squared" xLabel="Applied voltage (V)" yLabel="1/C² (10²⁴ F⁻²)" xDomain={[min, v.vbi]} yDomain={[0, inv[0][1] * 1.1]} series={[{
          name: '1/C²',
          color: orange,
          points: [...inv, [v.vbi, 0]]
        }]} markers={[{
          x: v.vbi,
          label: 'Vbi intercept'
        }]} /></div><Info intuition="Wider depletion separates more charge across a larger distance, so capacitance falls under reverse bias." model="Uniform doping makes 1/C² a straight line versus applied voltage; its slope reveals donor density." takeaway="The slope gives Nᴅ and the voltage-axis intercept gives Vbi." derivation={['C_j=\\varepsilon_sA/W', '\\frac1{C_j^2}=\\frac{2(V_{bi}-V_A)}{q\\varepsilon_sA^2N_D}', 'N_D=-\\frac{2}{q\\varepsilon_sA^2(d(1/C^2)/dV_A)}']} /></DemoLayout>;
  } catch (e) {
    return <ErrorBox error={e} />;
  }
}
