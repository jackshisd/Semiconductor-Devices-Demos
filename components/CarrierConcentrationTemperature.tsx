'use client';

import { Controls } from './Controls';
import Plot from './Plot';
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
import { donorCarrierState } from '../lib/donor-freeze-out';

export function CarrierConcentrationTemperature() {
  const { v, set, reset } = useParams({ T: 300, ND: 1e15 });
  const state = donorCarrierState(v.T, v.ND);
  const electronCurve = pts(20, 600, 290, (T) => donorCarrierState(T, v.ND).n / v.ND);
  const intrinsicCurve = pts(20, 600, 290, (T) => donorCarrierState(T, v.ND).intrinsic / v.ND);
  const upper = Math.max(2.2, Math.ceil((donorCarrierState(600, v.ND).n / v.ND) * 1.1));
  const temperatures = Array.from({ length: 581 }, (_, index) => index + 20);
  const freezeEnd =
    temperatures.find((T) => donorCarrierState(T, v.ND).ionized >= 0.9 * v.ND) ?? 600;
  const intrinsicStart =
    temperatures.find((T) => donorCarrierState(T, v.ND).intrinsic >= v.ND) ?? 600;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            { key: 'T', label: 'Silicon temperature', min: 20, max: 600, step: 1, unit: 'K' },
            {
              key: 'ND',
              label: 'Donor concentration',
              min: 1e14,
              max: 1e16,
              step: 1e13,
              unit: 'cm⁻³',
              log: true,
            },
          ]}
        />
      }
      calculation={
        <Calculation
          title="Donor ionization and charge neutrality"
          formula={String.raw`N_D^+=\frac{N_D}{1+2(n/N_C)e^{(E_C-E_D)/(k_BT)}},\qquad n=N_D^++\frac{n_i^2}{n}`}
          substitution={String.raw`T=${fmt(v.T, 0)}\,\mathrm K,\quad N_D=${texSci(v.ND)}\,\mathrm{cm}^{-3},\quad E_C-E_D=0.054\,\mathrm{eV},\quad n=${texSci(state.n)}\,\mathrm{cm}^{-3}`}
        />
      }
    >
      <Metrics>
        <Metric label="Electron concentration n" value={sci(state.n)} unit="cm⁻³" />
        <Metric label="Ionized donors ND⁺" value={sci(state.ionized)} unit="cm⁻³" />
        <Metric label="Intrinsic concentration ni" value={sci(state.intrinsic)} unit="cm⁻³" />
        <Metric label="Temperature region" value={state.regime} />
      </Metrics>
      <Plot
        title="Electron concentration across temperature regions"
        xLabel="Temperature (K)"
        yLabel="Concentration / ND"
        xDomain={[20, 600]}
        yDomain={[0, upper]}
        zones={[
          { from: 20, to: freezeEnd, color: '#5882ba' },
          { from: freezeEnd, to: intrinsicStart, color: '#6b9c80' },
          { from: intrinsicStart, to: 600, color: '#d8955d' },
        ]}
        series={[
          { name: 'n / ND', color: '#176fa9', points: electronCurve },
          { name: 'ni / ND', color: '#b35c33', points: intrinsicCurve, dash: true },
        ]}
        markers={[{ x: v.T, label: `T = ${fmt(v.T, 0)} K` }]}
        points={[
          {
            x: v.T,
            y: state.n / v.ND,
            label: `n/ND = ${fmt(state.n / v.ND, 3)}`,
            color: '#176fa9',
          },
        ]}
        height={350}
        onInspect={(T) => {
          const inspected = donorCarrierState(T, v.ND);
          return `${fmt(T, 0)} K · n/ND = ${fmt(inspected.n / v.ND, 3)} · ${inspected.regime}`;
        }}
      />
      <p className="teaching-caption concentration-temperature-caption">
        Low temperature: donors remain mostly neutral. Moderate temperature: nearly all donors
        ionize, so n ≈ ND. High temperature: thermally generated carriers dominate and n approaches
        ni. This simplified model assumes uncompensated n-type silicon and nondegenerate statistics.
      </p>
    </DemoLayout>
  );
}
