'use client';

import { useState } from 'react';
import { Controls, Toggle } from './Controls';
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
import * as P from '../lib/physics';

export function IntrinsicCarriers() {
  const { v, set, reset } = useParams({ T: 300 });
  const [log, setLog] = useState(true);
  const concentration = P.ni(v.T);
  const curve = pts(200, 600, 200, (T) => (log ? Math.log10(P.ni(T)) : P.ni(T)));
  const nc = P.Nc(v.T);
  const nv = P.Nv(v.T);
  const ncCurve = pts(200, 600, 200, P.Nc);
  const nvCurve = pts(200, 600, 200, P.Nv);
  const y = log ? Math.log10(concentration) : concentration;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setLog(true);
          }}
          items={[
            { key: 'T', label: 'Silicon temperature', min: 200, max: 600, step: 1, unit: 'K' },
          ]}
        >
          <Toggle label="Log concentration axis" checked={log} onChange={setLog} />
        </Controls>
      }
      calculation={
        <Calculation
          title="Intrinsic silicon: temperature dependence"
          formula={String.raw`n_i(T)=\sqrt{N_C(T)N_V(T)}\exp\!\left[-\frac{E_g}{2k_BT}\right],\qquad n=p=n_i`}
          substitution={String.raw`T=${fmt(v.T, 0)}\,\mathrm K,\quad E_g=${fmt(P.bandgap(v.T), 3)}\,\mathrm{eV},\quad n_i=\sqrt{(${texSci(P.Nc(v.T))})(${texSci(P.Nv(v.T))})}\exp\!\left[-\frac{${fmt(P.bandgap(v.T), 3)}}{2(${texSci(P.kEV)})(${fmt(v.T, 0)})}\right]=${texSci(concentration)}\,\mathrm{cm}^{-3}`}
        />
      }
    >
      <Metrics>
        <Metric label="Intrinsic concentration ni = n = p" value={sci(concentration)} unit="cm⁻³" />
        <Metric label="Conduction-band effective density Nc" value={sci(nc)} unit="cm⁻³" />
        <Metric label="Valence-band effective density Nv" value={sci(nv)} unit="cm⁻³" />
        <Metric label="Temperature" value={fmt(v.T, 0)} unit={`K · ${fmt(v.T - 273.15, 1)} °C`} />
      </Metrics>
      <div className="graph-grid intrinsic-graphs">
        <Plot
          title="Intrinsic carrier concentration in silicon"
          xLabel="Temperature (K)"
          yLabel={log ? 'log₁₀ ni (cm⁻³)' : 'ni (cm⁻³)'}
          xDomain={[200, 600]}
          yDomain={
            log
              ? [Math.floor(Math.log10(P.ni(200))), Math.ceil(Math.log10(P.ni(600)))]
              : [0, P.ni(600) * 1.05]
          }
          series={[
            {
              name: log ? 'log₁₀ intrinsic concentration' : 'Intrinsic concentration',
              color: '#176fa9',
              points: curve,
            },
          ]}
          markers={[{ x: v.T, label: `T = ${fmt(v.T, 0)} K` }]}
          points={[{ x: v.T, y, label: `ni = ${sci(concentration)} cm⁻³`, color: '#176fa9' }]}
          height={320}
          onInspect={(T) => `${fmt(T, 0)} K · ni = ${sci(P.ni(T))} cm⁻³`}
        />
        <Plot
          title="Conduction-band effective density of states Nc"
          xLabel="Temperature (K)"
          yLabel="Nc (cm⁻³)"
          xDomain={[200, 600]}
          yDomain={[0, P.Nc(600) * 1.05]}
          series={[{ name: 'Nc ∝ T³ᐟ²', color: '#b35c33', points: ncCurve }]}
          markers={[{ x: v.T, label: `T = ${fmt(v.T, 0)} K` }]}
          points={[{ x: v.T, y: nc, label: `Nc = ${sci(nc)} cm⁻³`, color: '#b35c33' }]}
          height={300}
          onInspect={(T) => `${fmt(T, 0)} K · Nc = ${sci(P.Nc(T))} cm⁻³`}
        />
        <Plot
          title="Valence-band effective density of states Nv"
          xLabel="Temperature (K)"
          yLabel="Nv (cm⁻³)"
          xDomain={[200, 600]}
          yDomain={[0, P.Nv(600) * 1.05]}
          series={[{ name: 'Nv ∝ T³ᐟ²', color: '#6d58a8', points: nvCurve }]}
          markers={[{ x: v.T, label: `T = ${fmt(v.T, 0)} K` }]}
          points={[{ x: v.T, y: nv, label: `Nv = ${sci(nv)} cm⁻³`, color: '#6d58a8' }]}
          height={300}
          onInspect={(T) => `${fmt(T, 0)} K · Nv = ${sci(P.Nv(T))} cm⁻³`}
        />
      </div>
    </DemoLayout>
  );
}
