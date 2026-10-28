'use client';

import { useState } from 'react';
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
import { highLevelInjection } from '../lib/high-level-injection';

export default function HighLevelInjection() {
  const { v, set, reset } = useParams({ N: 1e15, VA: 0.55 });
  const [lightSide, setLightSide] = useState<'n' | 'p'>('n');
  const state = highLevelInjection(v.N, v.VA);
  const high = state.injectionRatio >= 1;
  const minorityName = lightSide === 'n' ? 'Holes pₙ' : 'Electrons nₚ';
  const majorityName = lightSide === 'n' ? 'Electrons nₙ' : 'Holes pₚ';
  const minorityColor = lightSide === 'n' ? '#d47748' : '#2672d9';
  const majorityColor = lightSide === 'n' ? '#2672d9' : '#d47748';
  const logRatio = (value: number) => Math.log10(Math.max(1e-6, value / v.N));
  const distance = pts(0, 5, 140, (x) => x).map(([x]) => ({ x, ...state.profile(x) }));
  const edge = state.profile(0);

  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setLightSide('n');
          }}
          items={[
            { key: 'VA', label: 'Forward bias', min: 0, max: 0.9, step: 0.005, unit: 'V' },
            {
              key: 'N',
              label: 'Light-side ionized dopants',
              min: 1e14,
              max: 1e17,
              step: 1e13,
              unit: 'cm⁻³',
              log: true,
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Junction doping arrangement">
            <button
              type="button"
              className={lightSide === 'n' ? 'active' : ''}
              aria-pressed={lightSide === 'n'}
              onClick={() => setLightSide('n')}
            >
              p⁺n · light n side
            </button>
            <button
              type="button"
              className={lightSide === 'p' ? 'active' : ''}
              aria-pressed={lightSide === 'p'}
              onClick={() => setLightSide('p')}
            >
              pn⁺ · light p side
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Junction-edge carrier balance at 300 K"
          forms={[
            {
              label: 'Forward-bias product and local neutrality',
              formula: String.raw`mM=n_i^2e^{V_A/V_T},\qquad M-m=N_{\rm light}`,
            },
            {
              label: 'High-level onset when minority equals doping',
              formula: String.raw`V_{\rm HLI}=V_T\ln\!\left(\frac{2N_{\rm light}^2}{n_i^2}\right)`,
            },
          ]}
          substitution={String.raw`V_A=${fmt(v.VA, 3)}\,\mathrm V,\quad m_{\rm edge}=${texSci(state.minority)},\quad M_{\rm edge}=${texSci(state.majority)}\;\mathrm{cm}^{-3}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Forward bias injects minority carriers into the lightly doped side. Charge neutrality makes
        the local majority concentration rise with them. Switch junction polarity to compare the p⁺n
        and pn⁺ cases shown on the slide.
      </p>
      <Metrics>
        <Metric
          label="Minority / light-side doping"
          value={sci(state.injectionRatio)}
          unit="at depletion edge"
        />
        <Metric label="High-level onset bias" value={fmt(state.onsetVoltage, 3)} unit="V (model)" />
        <Metric label="Minority at edge" value={sci(state.minority)} unit="cm⁻³" />
        <Metric label="Majority at edge" value={sci(state.majority)} unit="cm⁻³" />
      </Metrics>
      <p className={`hli-status ${high ? 'hli-status-high' : ''}`} role="status">
        {high
          ? `High-level injection: ${minorityName} at the edge is at least as dense as the light-side dopants. ${majorityName} now has a substantial gradient.`
          : `Low-level injection: ${minorityName} at the edge remains below the light-side dopants. ${majorityName} is nearly flat.`}
      </p>
      <Plot
        title={`Carrier profiles in the lightly doped ${lightSide}-type region`}
        xLabel="Distance from depletion edge (illustrative diffusion lengths)"
        yLabel="log₁₀(carrier / Nlight)"
        xDomain={[0, 5]}
        yDomain={[-6, 4]}
        height={350}
        series={[
          {
            name: `${majorityName} · majority`,
            color: majorityColor,
            points: distance.map(({ x, majority }) => [x, logRatio(majority)]),
          },
          {
            name: `${minorityName} · minority`,
            color: minorityColor,
            points: distance.map(({ x, minority }) => [x, logRatio(minority)]),
          },
          {
            name: 'Equilibrium majority',
            color: '#89979f',
            dash: true,
            points: [
              [0, 0],
              [5, 0],
            ],
          },
        ]}
        points={[
          { x: 0, y: logRatio(edge.majority), label: majorityName, color: majorityColor },
          { x: 0, y: logRatio(edge.minority), label: minorityName, color: minorityColor },
        ]}
        onInspect={(x) => {
          const profile = state.profile(x);
          return `${fmt(x, 2)} lengths from edge · ${majorityName} ${sci(profile.majority)} cm⁻³ · ${minorityName} ${sci(profile.minority)} cm⁻³`;
        }}
      />
      <p className="teaching-caption">
        The graph uses a logarithmic concentration scale, like the slide. Values below 10⁻⁶ of
        Nlight sit at the bottom edge. The spatial decay is a schematic exponential profile; at
        high-level injection, coupled carrier transport changes its actual shape. The calculation
        identifies the onset from the edge concentrations, not a complete high-level diode current
        law.
      </p>
      <section className="hli-current-note" aria-label="Current direction consequence">
        <strong>Why the ideal current estimate changes</strong>
        <p>
          When the majority profile bends, majority carriers diffuse down their new concentration
          gradient. That diffusion contribution opposes the ideal forward-current contribution in
          this junction. A self-consistent electric field and ambipolar transport determine the
          final current; the low-level ideal diode equation no longer applies by itself.
        </p>
      </section>
    </DemoLayout>
  );
}
