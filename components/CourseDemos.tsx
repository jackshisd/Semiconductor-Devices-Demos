'use client';
import { useState } from 'react';
import { Controls, Toggle } from './Controls';
import {
  Calculation,
  DemoLayout,
  Metric,
  Metrics,
  fmt,
  pts,
  sci,
  texSci,
  useParams,
} from './Demos';
import Plot from './Plot';
import * as P from '../lib/physics';

export function CourseDegenerate() {
  const { v, set, reset } = useParams({ EF: 0.4, T: 300 });
  const VT = P.thermalVoltage(v.T),
    Ec = 0.56,
    Ev = -0.56;
  const valid = v.EF >= Ev + 3 * VT && v.EF <= Ec - 3 * VT;
  const f = (E: number) => 1 / (1 + Math.exp((E - v.EF) / VT));
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'EF',
              label: 'Fermi energy relative to midgap',
              min: -0.8,
              max: 0.8,
              step: 0.001,
              unit: 'eV',
            },
            { key: 'T', label: 'Temperature', min: 200, max: 450, step: 1, unit: 'K' },
          ]}
        />
      }
      calculation={
        <Calculation
          title="Nondegenerate range · Lecture 3, slide 17"
          formula={String.raw`E_V+3kT\le E_F\le E_C-3kT`}
          substitution={String.raw`${fmt(Ev + 3 * VT)}\le ${fmt(v.EF)}\le ${fmt(Ec - 3 * VT)}\quad\mathrm{eV}`}
        />
      }
    >
      <Metrics>
        <Metric label="Statistics range" value={valid ? 'Nondegenerate' : 'Degenerate'} />
        <Metric label="3kT" value={fmt(3 * VT)} unit="eV" />
        <Metric label="300 K n-type threshold" value="1.6 × 10¹⁸" unit="cm⁻³" />
        <Metric label="300 K p-type threshold" value="9.1 × 10¹⁷" unit="cm⁻³" />
      </Metrics>
      <Plot
        title="Fermi level approaching the bands"
        xLabel="Energy relative to midgap (eV)"
        yLabel="Occupation probability"
        xDomain={[-0.8, 0.8]}
        yDomain={[0, 1]}
        height={430}
        series={[
          { name: 'Electron probability f(E)', color: '#2672d9', points: pts(-0.8, 0.8, 240, f) },
          {
            name: 'Hole probability 1 − f(E)',
            color: '#d56138',
            points: pts(-0.8, 0.8, 240, (E) => 1 - f(E)),
          },
        ]}
        markers={[
          { x: Ev, label: 'Ev' },
          { x: Ec, label: 'Ec' },
          { x: v.EF, label: 'EF' },
          { x: Ev + 3 * VT, label: 'Ev + 3kT' },
          { x: Ec - 3 * VT, label: 'Ec − 3kT' },
        ]}
      />
    </DemoLayout>
  );
}

export function CourseQuasiFermi() {
  const { v, set, reset } = useParams({ N: 1e16, excess: 1e13, T: 300 });
  const [pType, setPType] = useState(false),
    [log, setLog] = useState(true);
  const ni = P.ni(v.T),
    VT = P.thermalVoltage(v.T);
  const majority = (v.N + Math.hypot(v.N, 2 * ni)) / 2,
    minority = (ni * ni) / majority;
  const n0 = pType ? minority : majority,
    p0 = pType ? majority : minority,
    n = n0 + v.excess,
    p = p0 + v.excess;
  const Fn = VT * Math.log(n / ni),
    Fp = -VT * Math.log(p / ni),
    EF = VT * Math.log(n0 / ni);
  const Ec = 0.56 - P.intrinsicMidgapOffset(v.T),
    Ev = Ec - 1.12;
  const transform = (x: number) => (log ? Math.log10(x) : x);
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setPType(false);
            setLog(true);
          }}
          items={[
            {
              key: 'N',
              label: 'Dopant concentration',
              min: 1e12,
              max: 1e17,
              step: 1e12,
              unit: 'cm⁻³',
              log: true,
            },
            {
              key: 'excess',
              label: 'Equal excess electrons and holes',
              min: 1e8,
              max: 1e16,
              step: 1e8,
              unit: 'cm⁻³',
              log: true,
            },
            { key: 'T', label: 'Temperature', min: 200, max: 450, step: 1, unit: 'K' },
          ]}
        >
          <Toggle label="P-type material" checked={pType} onChange={setPType} />
          <Toggle label="Log carrier axis" checked={log} onChange={setLog} />
        </Controls>
      }
      calculation={
        <Calculation
          title="Quasi-Fermi levels · Lecture 5, slide 21"
          forms={[
            {
              label: 'Electron concentration',
              formula: String.raw`n=n_0+\Delta n=n_i e^{(F_n-E_i)/kT}`,
            },
            {
              label: 'Hole concentration',
              formula: String.raw`p=p_0+\Delta p=n_i e^{(E_i-F_p)/kT}`,
            },
            {
              label: 'Equivalent energy forms',
              formula: String.raw`F_n=E_i+kT\ln(n/n_i),\quad F_p=E_i-kT\ln(p/n_i)`,
            },
          ]}
          substitution={String.raw`F_n-E_i=${fmt(Fn)}\,\mathrm{eV},\quad F_p-E_i=${fmt(Fp)}\,\mathrm{eV},\quad\Delta n=\Delta p=${texSci(v.excess)}\,\mathrm{cm^{-3}}`}
        />
      }
    >
      <Metrics>
        <Metric label="Electrons n" value={sci(n)} unit="cm⁻³" />
        <Metric label="Holes p" value={sci(p)} unit="cm⁻³" />
        <Metric label="Fn − Ei" value={fmt(Fn)} unit="eV" />
        <Metric label="Fp − Ei" value={fmt(Fp)} unit="eV" />
      </Metrics>
      {v.excess > 0.1 * majority && (
        <p className="notice">
          Low-level injection requires excess carriers to be much smaller than the equilibrium
          majority concentration.
        </p>
      )}
      <div className="graph-grid">
        <Plot
          title="Equilibrium and injected energy levels"
          xLabel="Position (schematic)"
          yLabel="Energy relative to Ei (eV)"
          xDomain={[0, 1]}
          yDomain={[-0.75, 0.75]}
          series={[
            {
              name: 'Ec',
              color: '#2672d9',
              points: [
                [0, Ec],
                [1, Ec],
              ],
            },
            {
              name: 'Ev',
              color: '#d56138',
              points: [
                [0, Ev],
                [1, Ev],
              ],
            },
            {
              name: 'Equilibrium EF',
              color: '#7a8890',
              dash: true,
              points: [
                [0, EF],
                [1, EF],
              ],
            },
            {
              name: 'Fn',
              color: '#14875f',
              points: [
                [0, Fn],
                [1, Fn],
              ],
            },
            {
              name: 'Fp',
              color: '#7654ba',
              points: [
                [0, Fp],
                [1, Fp],
              ],
            },
          ]}
        />
        <Plot
          title="Equal-pair injection changes both populations"
          xLabel="log₁₀ excess concentration (cm⁻³)"
          yLabel={log ? 'log₁₀ carrier concentration (cm⁻³)' : 'Carrier concentration (cm⁻³)'}
          xDomain={[8, 16]}
          yDomain={log ? [0, 18] : [0, 1.2 * (majority + 1e16)]}
          series={[
            {
              name: 'n',
              color: '#2672d9',
              points: pts(8, 16, 160, (x) => transform(n0 + 10 ** x)),
            },
            {
              name: 'p',
              color: '#d56138',
              points: pts(8, 16, 160, (x) => transform(p0 + 10 ** x)),
            },
          ]}
          markers={[{ x: Math.log10(v.excess), label: 'Selected injection' }]}
        />
      </div>
    </DemoLayout>
  );
}

export function CourseIdealDiode() {
  const { v, set, reset } = useParams({ N: 1e16, VA: 0.3, T: 300, tau: 1e-6 });
  const [log, setLog] = useState(false);
  const model = (V: number) => P.idealDiode(v.N, v.N, V, v.T, v.tau),
    r = model(v.VA);
  const forward = (V: number) => (log ? Math.log10(Math.max(model(V).J, 1e-30)) : model(V).J);
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setLog(false);
          }}
          items={[
            {
              key: 'N',
              label: 'NA = ND',
              min: 1e14,
              max: 1e17,
              step: 1e14,
              unit: 'cm⁻³',
              log: true,
            },
            { key: 'VA', label: 'Applied voltage', min: -1, max: 0.6, step: 0.001, unit: 'V' },
            { key: 'T', label: 'Temperature', min: 200, max: 450, step: 1, unit: 'K' },
            {
              key: 'tau',
              label: 'Minority lifetime',
              min: 1e-9,
              max: 1e-3,
              step: 1e-9,
              unit: 's',
              log: true,
            },
          ]}
        >
          <Toggle label="Log forward-current axis" checked={log} onChange={setLog} />
        </Controls>
      }
      calculation={
        <Calculation
          title="Ideal diode · Lecture 7, slides 17–18"
          forms={[
            { label: 'Current density', formula: String.raw`J=J_0(e^{V_A/V_T}-1),\quad V_T=kT/q` },
            {
              label: 'Saturation current density',
              formula: String.raw`J_0=q n_i^2\left(\frac{D_n}{L_nN_A}+\frac{D_p}{L_pN_D}\right)`,
            },
            {
              label: 'Diffusion lengths',
              formula: String.raw`L_n=\sqrt{D_n\tau_n},\quad L_p=\sqrt{D_p\tau_p}`,
            },
          ]}
          substitution={String.raw`J_0=${texSci(r.J0)}\,\mathrm{A/cm^2},\quad J(${fmt(v.VA)})=${texSci(r.J)}\,\mathrm{A/cm^2}`}
        />
      }
    >
      <Metrics>
        <Metric label="Current density" value={sci(r.J)} unit="A/cm²" />
        <Metric label="Saturation current density" value={sci(r.J0)} unit="A/cm²" />
        <Metric label="Electron diffusion length" value={fmt(P.um(r.Ln), 1)} unit="µm" />
        <Metric label="Hole diffusion length" value={fmt(P.um(r.Lp), 1)} unit="µm" />
      </Metrics>
      {!r.lowInjection && (
        <p className="notice">
          The selected bias exceeds the low-level injection assumption used for the ideal diode
          equation.
        </p>
      )}
      <div className="graph-grid breakdown-graphs">
        <Plot
          title="Forward current"
          xLabel="Forward bias (V)"
          yLabel={log ? 'log₁₀ J (A/cm²)' : 'J (A/cm²)'}
          xDomain={[0.001, 0.6]}
          yDomain={
            log ? [Math.floor(forward(0.001)), Math.ceil(forward(0.6))] : [0, forward(0.6) * 1.05]
          }
          series={[
            { name: 'Ideal diode', color: '#2672d9', points: pts(0.001, 0.6, 240, forward) },
          ]}
        />
        <Plot
          title="Reverse saturation"
          xLabel="Applied voltage (V)"
          yLabel="J (A/cm²)"
          xDomain={[-1, 0]}
          yDomain={[-1.1 * r.J0, 0.1 * r.J0]}
          series={[
            {
              name: 'Ideal reverse current',
              color: '#d56138',
              points: pts(-1, 0, 160, (V) => model(V).J),
            },
          ]}
        />
        <Plot
          title="Minority carriers at the depletion edges"
          xLabel="Applied voltage (V)"
          yLabel="Edge carrier density (cm⁻³)"
          xDomain={[-0.1, 0.6]}
          yDomain={[0, model(0.6).npEdge * 1.1]}
          series={[
            {
              name: 'np(−xp) = pn(xn)',
              color: '#14875f',
              points: pts(-0.1, 0.6, 180, (V) => model(V).npEdge),
            },
          ]}
        />
        <Plot
          title="Reverse breakdown: qualitative I–V from Lecture 8"
          xLabel="Reverse ← applied bias → forward (schematic)"
          yLabel="Current (schematic)"
          xDomain={[-10, 1]}
          yDomain={[-5, 5]}
          series={[
            {
              name: 'Breakdown and forward conduction · shape only',
              color: '#7654ba',
              points: [
                [-9, -5],
                [-8.7, -2],
                [-8.5, -0.3],
                [-8, -0.12],
                [-1, -0.12],
                [0, 0],
                [0.4, 0.2],
                [0.6, 1],
                [0.8, 3],
                [1, 5],
              ],
            },
          ]}
          markers={[{ x: -8.5, label: 'Breakdown' }]}
        />
      </div>
      <p className="teaching-caption">
        The breakdown panel reproduces the qualitative curve in Lecture 8, slide 4. Its axes have no
        calibrated current or voltage scale; the ideal diode equation does not predict breakdown.
      </p>
    </DemoLayout>
  );
}
