'use client';

import { Controls } from './Controls';
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
import { minorityChargeStorage } from '../lib/minority-charge-storage';

export default function MinorityChargeStorage() {
  const { v, set, reset } = useParams({ VA: 0.25, NA: 1e17, ND: 1e16, tau: 1e-6 });
  const state = minorityChargeStorage({ NA: v.NA, ND: v.ND, voltage: v.VA, lifetime: v.tau });
  const electronLengthUm = state.electronLength * 1e4;
  const holeLengthUm = state.holeLength * 1e4;
  const extent = 4.2 * Math.max(electronLengthUm, holeLengthUm);
  const edge = 1;
  const electrons = pts(0, extent - edge, 120, (distance) => state.electronExcess(distance * 1e-4))
    .map(([distance, excess]) => [-edge - distance, excess] as [number, number])
    .reverse();
  const holes = pts(0, extent - edge, 120, (distance) => state.holeExcess(distance * 1e-4)).map(
    ([distance, excess]) => [edge + distance, excess] as [number, number],
  );
  const maxExcess = Math.max(Math.abs(state.electronEdgeExcess), Math.abs(state.holeEdgeExcess));
  const yDomain: [number, number] =
    maxExcess === 0
      ? [-1, 1]
      : state.edgeFactor > 0
        ? [-0.08 * maxExcess, 1.16 * maxExcess]
        : [-1.16 * maxExcess, 0.08 * maxExcess];
  const status = v.VA > 0 ? 'Forward injection' : v.VA < 0 ? 'Reverse-bias deficit' : 'Equilibrium';
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'VA',
              label: 'Applied junction bias',
              min: -0.3,
              max: 0.45,
              step: 0.005,
              unit: 'V',
            },
            {
              key: 'NA',
              label: 'P-side acceptor density',
              min: 1e15,
              max: 1e18,
              step: 1e14,
              unit: 'cm⁻³',
              log: true,
            },
            {
              key: 'ND',
              label: 'N-side donor density',
              min: 1e15,
              max: 1e18,
              step: 1e14,
              unit: 'cm⁻³',
              log: true,
            },
            {
              key: 'tau',
              label: 'Minority-carrier lifetime',
              min: 1e-8,
              max: 1e-5,
              step: 1e-9,
              unit: 's',
              log: true,
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Bias presets">
            <button
              type="button"
              className={v.VA === 0.3 ? 'active' : ''}
              onClick={() => set('VA', 0.3)}
            >
              Forward bias
            </button>
            <button
              type="button"
              className={v.VA === 0 ? 'active' : ''}
              onClick={() => set('VA', 0)}
            >
              Equilibrium
            </button>
            <button
              type="button"
              className={v.VA === -0.2 ? 'active' : ''}
              onClick={() => set('VA', -0.2)}
            >
              Reverse bias
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Steady-state low-level charge storage at 300 K"
          forms={[
            {
              label: 'Excess at either depletion edge',
              formula: String.raw`\Delta n_p(0)=n_{p0}(e^{V_A/V_T}-1),\quad\Delta p_n(0)=p_{n0}(e^{V_A/V_T}-1)`,
            },
            {
              label: 'Spatial decay and integrated charge',
              formula: String.raw`\Delta n_p(d)=\Delta n_p(0)e^{-d/L_n},\quad Q_n/A=q\Delta n_p(0)L_n`,
            },
          ]}
          substitution={String.raw`V_A=${fmt(v.VA, 3)}\,\mathrm V,\quad\Delta n_p(0)=${texSci(state.electronEdgeExcess)},\quad\Delta p_n(0)=${texSci(state.holeEdgeExcess)}\;\mathrm{cm}^{-3}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Move the bias through zero to see excess electrons on the p side and excess holes on the n
        side. The colored curves are signed changes from each side’s equilibrium minority density.
      </p>
      <Metrics>
        <Metric label="Bias regime" value={status} unit="" />
        <Metric
          label="P-side electron edge excess"
          value={sci(state.electronEdgeExcess)}
          unit="cm⁻³"
        />
        <Metric label="N-side hole edge excess" value={sci(state.holeEdgeExcess)} unit="cm⁻³" />
        <Metric
          label="P-side stored excess charge"
          value={sci(state.electronStoredChargePerArea)}
          unit="C/cm²"
        />
        <Metric
          label="N-side stored excess charge"
          value={sci(state.holeStoredChargePerArea)}
          unit="C/cm²"
        />
      </Metrics>
      <Plot
        title="Excess minority-carrier distributions"
        xLabel="Position from depletion edges (µm) · p side ← | → n side"
        yLabel="Signed excess (cm⁻³)"
        xDomain={[-extent, extent]}
        yDomain={yDomain}
        height={350}
        zones={[{ from: -edge, to: edge, color: '#edf1f5' }]}
        series={[
          { name: 'Δnₚ · electrons on p side', color: '#2672d9', points: electrons, areaTo: 0 },
          { name: 'Δpₙ · holes on n side', color: '#d47748', points: holes, areaTo: 0 },
          {
            name: 'Equilibrium excess = 0',
            color: '#71808c',
            dash: true,
            points: [
              [-extent, 0],
              [extent, 0],
            ],
          },
        ]}
        onInspect={(x) =>
          x < -edge
            ? `P side · Δnₚ = ${sci(state.electronExcess((-edge - x) * 1e-4))} cm⁻³`
            : x > edge
              ? `N side · Δpₙ = ${sci(state.holeExcess((x - edge) * 1e-4))} cm⁻³`
              : 'Depletion region (width schematic)'
        }
      />
      <p className="teaching-caption">
        {v.VA < 0
          ? 'Below zero means fewer minority carriers than at equilibrium; the actual carrier concentration stays nonnegative. Negative stored excess charge denotes a deficit relative to equilibrium.'
          : v.VA > 0
            ? 'Forward bias raises both edge concentrations. Each profile decays over its diffusion length, and its linear-area integral gives stored minority charge.'
            : 'At equilibrium, excess concentration and stored excess charge are zero on both sides.'}{' '}
        The gray depletion strip is schematic. This steady-state, low-level model excludes
        depletion-region generation and switching transients.
      </p>
    </DemoLayout>
  );
}
