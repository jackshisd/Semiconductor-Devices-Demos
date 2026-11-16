'use client';

import { useMemo, useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, useParams } from './Demos';
import Plot from './Plot';
import { deepDepletionAt } from '../lib/mos-lecture-thirteen';

const range: [number, number] = [-1.5, 3];

export default function MosDeepDepletion() {
  const { v, set, reset } = useParams({
    VG: 1.8,
    NA: 1e16,
    tox: 10,
    elapsedMs: 0,
    generationMs: 3,
  });
  const [contacted, setContacted] = useState(false);
  const params = useMemo(() => ({ acceptors: v.NA, oxideNm: v.tox, flatBand: 0 }), [v.NA, v.tox]);
  const at = (gate: number, time = v.elapsedMs, sourceDrain = contacted) =>
    deepDepletionAt(gate, params, time, v.generationMs, sourceDrain);
  const state = at(v.VG);
  const sweep = Array.from({ length: 121 }, (_, i) => {
    const gate = range[0] + (i * (range[1] - range[0])) / 120;
    return { gate, selected: at(gate), initial: at(gate, 0), recovered: at(gate, 40) };
  });
  const nm = (cm: number) => cm * 1e7;
  const depletionEnd =
    280 + Math.min(345, (260 * state.width) / Math.max(state.thresholdWidth, 1e-12));
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setContacted(false);
          }}
          items={[
            {
              key: 'VG',
              label: 'Gate voltage after sweep',
              min: range[0],
              max: range[1],
              step: 0.02,
              unit: 'V',
            },
            { key: 'elapsedMs', label: 'Time after sweep', min: 0, max: 20, step: 0.1, unit: 'ms' },
            {
              key: 'generationMs',
              label: 'Minority-carrier generation time',
              min: 0.2,
              max: 10,
              step: 0.1,
              unit: 'ms',
            },
            {
              key: 'NA',
              label: 'P-type acceptors',
              min: 1e15,
              max: 1e17,
              step: 1e14,
              log: true,
              unit: 'cm⁻³',
            },
            { key: 'tox', label: 'Oxide thickness', min: 5, max: 20, step: 0.5, unit: 'nm' },
          ]}
        >
          <div className="chips" role="group" aria-label="Carrier supply">
            <button
              type="button"
              className={!contacted ? 'active' : undefined}
              aria-pressed={!contacted}
              onClick={() => setContacted(false)}
            >
              Isolated capacitor
            </button>
            <button
              type="button"
              className={contacted ? 'active' : undefined}
              aria-pressed={contacted}
              onClick={() => setContacted(true)}
            >
              Source/drain supply
            </button>
            <button
              type="button"
              onClick={() => {
                setContacted(false);
                set('elapsedMs', 0);
                set('VG', Math.min(range[1], Math.max(state.threshold + 0.9, 1.5)));
              }}
            >
              Fast sweep into inversion
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Why deep depletion falls below Cmin"
          forms={[
            {
              label: 'Depletion-only voltage balance',
              formula: String.raw`V_G-V_{FB}=\frac{qN_AW^2}{2\varepsilon_{Si}}+\frac{qN_AW}{C_{ox}'}`,
            },
            {
              label: 'Series capacitance',
              formula: String.raw`C'_{HF}=\left(\frac1{C'_{ox}}+\frac{W}{\varepsilon_{Si}}\right)^{-1}`,
            },
            {
              label: 'Illustrative recovery',
              formula: String.raw`W(t)=W_T+[W_{deep}-W_T]e^{-t/\tau_g}`,
            },
          ]}
          substitution={String.raw`W=${fmt(nm(state.width), 1)}\,\mathrm{nm},\quad C'=${fmt(state.capacitance * 1e9, 1)}\,\mathrm{nF/cm^2}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Sweep a p-type MOS capacitor rapidly into inversion. Before enough minority electrons
        arrive, additional gate charge widens depletion; scrub time to watch the region recover.
        Source and drain contacts supply electrons immediately in the comparison mode.
      </p>
      <p className="capacitance-dominance" role="status">
        {state.deepDepletion
          ? 'Deep depletion: W exceeds its equilibrium threshold width, so capacitance drops below the usual high-frequency minimum.'
          : v.VG < state.threshold
            ? 'Before threshold, depletion width follows the ordinary gate-bias response.'
            : 'Inversion carriers have restored the threshold depletion width.'}
      </p>
      <Metrics>
        <Metric label="Threshold VT" value={fmt(state.threshold, 2)} unit="V" />
        <Metric label="Current depletion W" value={fmt(nm(state.width), 0)} unit="nm" />
        <Metric label="Threshold width WT" value={fmt(nm(state.thresholdWidth), 0)} unit="nm" />
        <Metric label="Carrier recovery" value={fmt(state.recovery * 100, 0)} unit="%" />
      </Metrics>
      <div className="plot-card">
        <div className="plot-title">
          <b>Where the gate charge is balanced</b>
          <span>Cross section · schematic</span>
        </div>
        <svg
          viewBox="0 0 680 188"
          role="img"
          aria-label={`P-type MOS capacitor with depletion width ${fmt(nm(state.width), 0)} nanometers and ${fmt(state.recovery * 100, 0)} percent recovered inversion carriers`}
        >
          <rect x="25" y="45" width="185" height="108" fill="#dce7f1" rx="7" />
          <rect x="210" y="45" width="70" height="108" fill="#fff0d5" />
          <rect x="280" y="45" width="375" height="108" fill="#edf8f3" rx="7" />
          <rect
            x="281"
            y="48"
            width={Math.max(0, depletionEnd - 281)}
            height="102"
            fill="#f8d5c6"
            opacity="0.78"
          />
          <line
            x1={depletionEnd}
            x2={depletionEnd}
            y1="48"
            y2="151"
            stroke="#b75d39"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <text x="115" y="39" textAnchor="middle" fontSize="13" fill="#435c75">
            Gate
          </text>
          <text x="245" y="39" textAnchor="middle" fontSize="13" fill="#8c681b">
            Oxide
          </text>
          <text x="467" y="39" textAnchor="middle" fontSize="13" fill="#276c4e">
            p-type Si
          </text>
          <text x="315" y="104" fontSize="13" fill="#a95132">
            − ionized acceptors
          </text>
          {Array.from({ length: Math.round(state.recovery * 10) }, (_, i) => (
            <circle
              key={i}
              cx={289 + (i % 5) * 9}
              cy={61 + Math.floor(i / 5) * 10}
              r="3"
              fill="#226cb0"
            />
          ))}
          <text x="281" y="174" fontSize="12" fill="#526578">
            interface
          </text>
          <text x={Math.min(depletionEnd + 5, 575)} y="174" fontSize="12" fill="#a95132">
            W = {fmt(nm(state.width), 0)} nm
          </text>
        </svg>
      </div>
      <Plot
        title="C–V after a fast sweep"
        xLabel="Gate voltage VG (V)"
        yLabel="C′ (nF/cm²)"
        xDomain={range}
        yDomain={[0, state.oxideCapacitance * 1e9 * 1.08]}
        markers={[
          { x: state.threshold, label: 'Threshold' },
          { x: v.VG, label: 'Selected gate' },
        ]}
        series={[
          {
            name: 'Immediately after fast sweep',
            color: '#d66b3f',
            dash: true,
            points: sweep.map((s) => [s.gate, s.initial.capacitance * 1e9]),
          },
          {
            name: 'After recovery / contacted',
            color: '#2681b5',
            dash: true,
            points: sweep.map((s) => [s.gate, s.recovered.capacitance * 1e9]),
          },
          {
            name: 'Selected time',
            color: '#684ab2',
            points: sweep.map((s) => [s.gate, s.selected.capacitance * 1e9]),
          },
        ]}
      />
      <p className="carrier-motion-summary">
        The recovery law is illustrative; the depletion-only voltage equation and series capacitance
        show why the branch falls. A real transient depends on generation, temperature, sweep
        history, and carrier supply.
      </p>
    </DemoLayout>
  );
}
