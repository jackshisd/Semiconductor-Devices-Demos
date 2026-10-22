'use client';

import { useState } from 'react';
import Plot from './Plot';
import ContinuityDiagram from './ContinuityDiagram';
import { Controls, Toggle, type Control } from './Controls';
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
import * as P from '../lib/physics';

const blue = '#2672d9';
const orange = '#d56138';
const green = '#14875f';

const dopingControl = (key: string, label: string): Control => ({
  key,
  label,
  min: 1e15,
  max: 1e18,
  step: 1e14,
  unit: 'cm⁻³',
  log: true,
});
const temperatureControl: Control = {
  key: 'T',
  label: 'Temperature',
  min: 200,
  max: 450,
  step: 1,
  unit: 'K',
};

export function DriftDiffusion() {
  const { v, set, reset } = useParams({ n0: 1e16, ell: 3, field: -100, mobility: 1400, T: 300 });
  const length = 5;
  const ellCm = v.ell * 1e-4;
  const density = (x: number) => v.n0 * Math.exp(x / v.ell);
  const current = (x: number) =>
    P.electronTransport(density(x), density(x) / ellCm, v.field, v.mobility, v.T);
  const atSurface = current(0);
  const nondegenerate = P.fermiOffset('n', density(length), v.T).boltzmannValid;
  const densityScale = 10 ** Math.floor(Math.log10(v.n0));
  const densityCurve = pts(0, length, 100, (x) => density(x) / densityScale);
  const drift = pts(0, length, 100, (x) => current(x).drift);
  const diffusion = pts(0, length, 100, (x) => current(x).diffusion);
  const total = pts(0, length, 100, (x) => current(x).total);
  const maxCurrent = Math.max(
    1e-10,
    ...drift.map((p) => Math.abs(p[1])),
    ...diffusion.map((p) => Math.abs(p[1])),
    ...total.map((p) => Math.abs(p[1])),
  );
  return (
    <DemoLayout
      calculation={
        <Calculation
          formula={String.raw`J_n=q\mu_n n\mathcal E+qD_n\frac{dn}{dx},\quad D_n=\mu_nV_T`}
          substitution={String.raw`J_n(0)=(${texSci(P.q)})(${fmt(v.mobility, 0)})(${texSci(v.n0)})\left[${fmt(v.field, 1)}+\frac{${fmt(P.thermalVoltage(v.T), 4)}}{${texSci(ellCm)}}\right]=${texSci(atSurface.total)}\,\mathrm{A/cm^2}`}
        />
      }
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'n0',
              label: 'Electron density at x = 0',
              min: 1e14,
              max: 1e18,
              step: 1e14,
              unit: 'cm⁻³',
              log: true,
            },
            { key: 'ell', label: 'Density gradient length', min: 1, max: 8, step: 0.1, unit: 'µm' },
            { key: 'field', label: 'Electric field', min: -500, max: 500, step: 1, unit: 'V/cm' },
            {
              key: 'mobility',
              label: 'Electron mobility',
              min: 100,
              max: 1500,
              step: 10,
              unit: 'cm²/(V·s)',
            },
            temperatureControl,
          ]}
        >
          <button className="reset-button" onClick={() => set('field', atSurface.equilibriumField)}>
            Set field for zero current
          </button>
        </Controls>
      }
    >
      <Metrics>
        <Metric label="Diffusion constant Dₙ" value={fmt(atSurface.D, 2)} unit="cm²/s" />
        <Metric label="Equilibrium field" value={fmt(atSurface.equilibriumField, 1)} unit="V/cm" />
        <Metric label="Total current at x = 0" value={sci(atSurface.total)} unit="A/cm²" />
      </Metrics>
      {!nondegenerate && (
        <div className="notice">
          The far end of this density profile is within 3kT of the conduction band. The
          nondegenerate Einstein relation is outside its assumed range.
        </div>
      )}
      <div className="graph-grid">
        <Plot
          title="Electron density"
          xLabel="Position (µm)"
          yLabel={`n (×10^${Math.floor(Math.log10(densityScale))} cm⁻³)`}
          xDomain={[0, length]}
          yDomain={[0, (density(length) / densityScale) * 1.12]}
          series={[{ name: 'n(x)', color: blue, points: densityCurve }]}
          points={[{ x: 0, y: v.n0 / densityScale, label: `n(0) ${sci(v.n0)} cm⁻³`, color: blue }]}
          onInspect={(x) => `n = ${sci(density(x))} cm⁻³`}
        />
        <Plot
          title="Drift and diffusion current"
          xLabel="Position (µm)"
          yLabel="Electron current density (A/cm²)"
          xDomain={[0, length]}
          yDomain={[-1.12 * maxCurrent, 1.12 * maxCurrent]}
          series={[
            { name: 'Drift', color: orange, points: drift },
            { name: 'Diffusion', color: blue, points: diffusion },
            { name: 'Total', color: green, points: total },
          ]}
          points={[
            {
              x: 0,
              y: atSurface.total,
              label: `Jₙ(0) ${sci(atSurface.total)} A/cm²`,
              color: green,
            },
          ]}
          onInspect={(x) =>
            `Jdrift ${sci(current(x).drift)} · Jdiff ${sci(current(x).diffusion)} · Jtotal ${sci(current(x).total)} A/cm²`
          }
        />
      </div>
    </DemoLayout>
  );
}

export function MinorityDiffusion() {
  const { v, set, reset } = useParams({
    ND: 1e16,
    excess: 1e14,
    field: 0,
    tau: 1e-6,
    mobility: 470,
    T: 300,
  });
  const [equilibrium, setEquilibrium] = useState(false);
  const field = 0;
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
  const currentRange =
    Math.max(1e-16, Math.abs(edge.total), Math.abs(edge.drift), Math.abs(edge.diffusionCurrent)) *
    1.2;
  const lowInjection = equilibrium || excess < 0.1 * v.ND;
  const zeroField = field === 0;
  const driftSpeed = v.mobility * field;
  const signedDrift = driftSpeed >= 0 ? '+' + fmt(driftSpeed, 0) : fmt(driftSpeed, 0);
  const formula = equilibrium
    ? 'p_{n0}=\\frac{n_i^2}{N_D},\\quad \\Delta p=0,\\quad J_p=0'
    : zeroField
      ? 'L_p=\\sqrt{D_p\\tau_p},\\quad \\Delta p(x)=\\Delta p(0)e^{-x/L_p}'
      : 'D_p\\Delta p^{\\prime\\prime}-\\mu_p\\mathcal E\\Delta p^{\\prime}-\\frac{\\Delta p}{\\tau_p}=0';
  const substitution = equilibrium
    ? 'p_{n0}=\\frac{(' +
      texSci(P.ni(v.T)) +
      ')^2}{' +
      texSci(v.ND) +
      '}=' +
      texSci(p0) +
      '\\,\\mathrm{cm^{-3}},\\quad J_p=0'
    : zeroField
      ? 'L_p=10^4\\sqrt{(' +
        fmt(r.D, 2) +
        ')(' +
        texSci(v.tau) +
        ')}=' +
        fmt(P.um(r.L), 2) +
        '\\,\\mu\\mathrm m'
      : 'L_E=10^4\\frac{' +
        texSci(v.tau) +
        '}{2}\\left[\\sqrt{(' +
        fmt(driftSpeed, 0) +
        ')^2+\\frac{4(' +
        fmt(r.D, 2) +
        ')}{' +
        texSci(v.tau) +
        '}}' +
        signedDrift +
        '\\right]=' +
        fmt(P.um(r.L), 2) +
        '\\,\\mu\\mathrm m';
  const activeControls: Control[] = equilibrium
    ? [dopingControl('ND', 'N-side donor density'), temperatureControl]
    : [
        dopingControl('ND', 'N-side donor density'),
        {
          key: 'excess',
          label: 'Excess holes at x = 0',
          min: 1e11,
          max: 1e17,
          step: 1e11,
          unit: 'cm⁻³',
          log: true,
        },
        {
          key: 'tau',
          label: 'Minority lifetime',
          min: 1e-9,
          max: 1e-3,
          step: 1e-9,
          unit: 's',
          log: true,
        },
        {
          key: 'mobility',
          label: 'Hole mobility',
          min: 100,
          max: 500,
          step: 10,
          unit: 'cm²/(V·s)',
        },
        temperatureControl,
      ];
  return (
    <DemoLayout
      calculation={<Calculation formula={formula} substitution={substitution} />}
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setEquilibrium(false);
          }}
          items={activeControls}
        >
          <Toggle
            label="Thermal equilibrium: no field or excess carriers"
            checked={equilibrium}
            onChange={setEquilibrium}
          />
        </Controls>
      }
    >
      <Metrics>
        <Metric
          label="Effective decay length"
          value={equilibrium ? '—' : fmt(P.um(r.L), 2)}
          unit={equilibrium ? '' : 'µm'}
        />
        <Metric label="Zero-field diffusion length" value={fmt(P.um(r.L0), 2)} unit="µm" />
        <Metric label="Equilibrium holes pₙ₀" value={sci(p0)} unit="cm⁻³" />
        <Metric label="Hole current at x = 0" value={sci(edge.total)} unit="A/cm²" />
      </Metrics>
      {!lowInjection && (
        <div className="notice">
          Excess holes exceed the low-level injection range (Δp(0) ≥ 0.1 Nᴅ). The exponential
          profile is an approximation here.
        </div>
      )}
      {!P.fermiOffset('n', v.ND, v.T).boltzmannValid && (
        <div className="notice">
          Doping is near the degenerate range; pₙ₀ = nᵢ²/Nᴅ uses nondegenerate statistics.
        </div>
      )}
      <div className="graph-grid">
        <Plot
          title="Minority hole concentration"
          xLabel="Distance from edge (µm)"
          yLabel={'p (×10^' + Math.floor(Math.log10(concentrationScale)) + ' cm⁻³)'}
          xDomain={[0, limit]}
          yDomain={[0, ((p0 + excess) / concentrationScale) * 1.15]}
          series={[
            {
              name: 'p(x)',
              color: orange,
              points: pts(0, limit, 120, (x) => at(x).density / concentrationScale),
            },
            ...(!equilibrium
              ? [
                  {
                    name: 'Equilibrium pₙ₀',
                    color: '#83929d',
                    points: [
                      [0, p0 / concentrationScale],
                      [limit, p0 / concentrationScale],
                    ] as [number, number][],
                    dash: true,
                  },
                ]
              : []),
          ]}
          points={[
            equilibrium
              ? {
                  x: 0,
                  y: p0 / concentrationScale,
                  label: 'pₙ₀ ' + sci(p0) + ' cm⁻³',
                  color: orange,
                }
              : {
                  x: P.um(r.L),
                  y: (p0 + excess / Math.E) / concentrationScale,
                  label: 'At Lᴇ: ' + sci(p0 + excess / Math.E) + ' cm⁻³',
                  color: orange,
                },
          ]}
          onInspect={(x) => 'p ' + sci(at(x).density) + ' · Δp ' + sci(at(x).excess) + ' cm⁻³'}
        />
        <Plot
          title="Hole current components"
          xLabel="Distance from edge (µm)"
          yLabel="Jₚ (A/cm²)"
          xDomain={[0, limit]}
          yDomain={[-currentRange, currentRange]}
          series={[
            { name: 'Total', color: '#14875f', points: pts(0, limit, 120, (x) => at(x).total) },
            ...(!equilibrium
              ? [
                  { name: 'Drift', color: orange, points: pts(0, limit, 120, (x) => at(x).drift) },
                  {
                    name: 'Diffusion',
                    color: blue,
                    points: pts(0, limit, 120, (x) => at(x).diffusionCurrent),
                  },
                ]
              : []),
          ]}
          points={[
            { x: 0, y: edge.total, label: 'Jₚ(0) ' + sci(edge.total) + ' A/cm²', color: '#14875f' },
          ]}
          onInspect={(x) =>
            'Drift ' +
            sci(at(x).drift) +
            ' · Diffusion ' +
            sci(at(x).diffusionCurrent) +
            ' · Total ' +
            sci(at(x).total) +
            ' A/cm²'
          }
        />
      </div>
    </DemoLayout>
  );
}

export function ContinuityEquation() {
  const { v, set, reset } = useParams({
    deltaJn: 0.004,
    deltaJp: -0.002,
    field: 100,
    deltaN: 2.7e11,
    deltaP: -4e11,
    G: 2e19,
    R: 1e19,
  });
  const lengthUm = 10,
    lengthCm = lengthUm * 1e-4;
  const r = P.continuityRates(v.deltaJn, v.deltaJp, lengthCm, v.G, v.R);
  const split = P.continuityCurrentSplit(v.deltaJn, v.deltaJp, v.field, v.deltaN, v.deltaP);
  const currentMax = Math.max(0.001, Math.abs(v.deltaJn) / 2, Math.abs(v.deltaJp) / 2) * 1.2;
  const scale = 1e19;
  const rates = [r.electronRate / scale, r.holeRate / scale, r.pairRate / scale];
  const rateMin = Math.min(0, ...rates),
    rateMax = Math.max(0, ...rates);
  const ratePadding = Math.max(1, rateMax - rateMin) * 0.18;
  return (
    <DemoLayout
      calculation={
        <Calculation
          title="Continuity equations"
          forms={[
            {
              label: 'Current divergence',
              formula: String.raw`\begin{aligned}
        \frac{\partial n}{\partial t}&=\frac{1}{q}\frac{\partial J_n}{\partial x}+G-R\\
        \frac{\partial p}{\partial t}&=-\frac{1}{q}\frac{\partial J_p}{\partial x}+G-R
      \end{aligned}`,
            },
            {
              label: 'Uniform-field drift and diffusion',
              formula: String.raw`\begin{aligned}
        \frac{\partial n}{\partial t}&=\mu_n\mathcal E\frac{\partial n}{\partial x}+D_n\frac{\partial^2 n}{\partial x^2}+G-R\\
        \frac{\partial p}{\partial t}&=-\mu_p\mathcal E\frac{\partial p}{\partial x}+D_p\frac{\partial^2 p}{\partial x^2}+G-R
      \end{aligned}`,
            },
            {
              label: 'Across the 10 µm slice',
              formula: String.raw`\begin{aligned}
        \dot n&=\frac{\Delta J_{n,\mathrm{drift}}+\Delta J_{n,\mathrm{diff}}}{q\,\Delta x}+G-R\\
        \dot p&=-\frac{\Delta J_{p,\mathrm{drift}}+\Delta J_{p,\mathrm{diff}}}{q\,\Delta x}+G-R
      \end{aligned}`,
            },
          ]}
          substitution={
            '\\begin{aligned}\\dot n&=\\frac{' +
            texSci(split.driftJn) +
            '+(' +
            texSci(split.diffJn) +
            ')}{' +
            texSci(P.q * lengthCm) +
            '}+(' +
            texSci(r.pairRate) +
            ')=' +
            texSci(r.electronRate) +
            '\\\\\\dot p&=-\\frac{' +
            texSci(split.driftJp) +
            '+(' +
            texSci(split.diffJp) +
            ')}{' +
            texSci(P.q * lengthCm) +
            '}+(' +
            texSci(r.pairRate) +
            ')=' +
            texSci(r.holeRate) +
            '\\end{aligned}\\;\\mathrm{cm^{-3}s^{-1}}'
          }
        />
      }
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'deltaJn',
              label: 'Electron current change ΔJₙ',
              min: -0.02,
              max: 0.02,
              step: 0.0001,
              unit: 'A/cm²',
            },
            {
              key: 'deltaJp',
              label: 'Hole current change ΔJₚ',
              min: -0.02,
              max: 0.02,
              step: 0.0001,
              unit: 'A/cm²',
            },
            { key: 'field', label: 'Electric field ℰ', min: -300, max: 300, step: 1, unit: 'V/cm' },
            {
              key: 'deltaN',
              label: 'Electron density change across slice Δn',
              min: -1e12,
              max: 1e12,
              step: 1e9,
              unit: 'cm⁻³',
            },
            {
              key: 'deltaP',
              label: 'Hole density change across slice Δp',
              min: -1e12,
              max: 1e12,
              step: 1e9,
              unit: 'cm⁻³',
            },
            {
              key: 'G',
              label: 'Pair generation G',
              min: 1e16,
              max: 1e21,
              step: 1e16,
              unit: 'cm⁻³/s',
              log: true,
            },
            {
              key: 'R',
              label: 'Pair recombination R',
              min: 1e16,
              max: 1e21,
              step: 1e16,
              unit: 'cm⁻³/s',
              log: true,
            },
          ]}
        />
      }
    >
      <Metrics>
        <Metric label="Electron density rate" value={sci(r.electronRate)} unit="cm⁻³/s" />
        <Metric label="Hole density rate" value={sci(r.holeRate)} unit="cm⁻³/s" />
        <Metric label="Net pair rate G−R" value={sci(r.pairRate)} unit="cm⁻³/s" />
        <Metric label="Charge rate" value={sci(r.chargeRate)} unit="C/(cm³·s)" />
      </Metrics>
      <ContinuityDiagram
        deltaJn={v.deltaJn}
        deltaJp={v.deltaJp}
        driftJn={split.driftJn}
        driftJp={split.driftJp}
        field={v.field}
        generation={v.G}
        recombination={v.R}
        lengthUm={lengthUm}
      />
      <div className="graph-grid">
        <Plot
          title="Net current across a 10 µm slice"
          xLabel="Position (µm)"
          yLabel="Current density (A/cm²)"
          xDomain={[0, lengthUm]}
          yDomain={[-currentMax, currentMax]}
          series={[
            {
              name: 'Jₙ',
              color: blue,
              points: [
                [0, -v.deltaJn / 2],
                [lengthUm, v.deltaJn / 2],
              ],
            },
            {
              name: 'Jₚ',
              color: orange,
              points: [
                [0, -v.deltaJp / 2],
                [lengthUm, v.deltaJp / 2],
              ],
            },
          ]}
          points={[
            {
              x: lengthUm,
              y: v.deltaJn / 2,
              label: 'ΔJₙ ' + sci(v.deltaJn) + ' A/cm²',
              color: blue,
            },
            {
              x: lengthUm,
              y: v.deltaJp / 2,
              label: 'ΔJₚ ' + sci(v.deltaJp) + ' A/cm²',
              color: orange,
            },
          ]}
          onInspect={(x) =>
            'Jₙ ' +
            sci(v.deltaJn * (x / lengthUm - 0.5)) +
            ' · Jₚ ' +
            sci(v.deltaJp * (x / lengthUm - 0.5)) +
            ' A/cm²'
          }
        />
        <Plot
          title="Instantaneous carrier balance"
          xLabel="Position (µm)"
          yLabel="Rate (10¹⁹ cm⁻³/s)"
          xDomain={[0, lengthUm]}
          yDomain={[rateMin - ratePadding, rateMax + ratePadding]}
          series={[
            {
              name: '∂n/∂t',
              color: blue,
              points: [
                [0, rates[0]],
                [lengthUm, rates[0]],
              ],
            },
            {
              name: '∂p/∂t',
              color: orange,
              points: [
                [0, rates[1]],
                [lengthUm, rates[1]],
              ],
            },
            {
              name: 'G−R',
              color: green,
              points: [
                [0, rates[2]],
                [lengthUm, rates[2]],
              ],
            },
          ]}
          points={[
            { x: 2, y: rates[0], label: '∂n/∂t ' + sci(r.electronRate), color: blue },
            { x: 5, y: rates[1], label: '∂p/∂t ' + sci(r.holeRate), color: orange },
          ]}
          onInspect={() =>
            'Electron ' + sci(r.electronRate) + ' · Hole ' + sci(r.holeRate) + ' cm⁻³/s'
          }
        />
      </div>
    </DemoLayout>
  );
}
