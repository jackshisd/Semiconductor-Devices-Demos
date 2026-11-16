'use client';

import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, useParams } from './Demos';
import Plot from './Plot';
import { gateStackState } from '../lib/mos-lecture-thirteen';

export default function MosGateStack() {
  const { v, set, reset } = useParams({ tox: 8, Npoly: 1e19, Eox: 1.2, Tinv: 1.5 });
  const at = (field: number, doping = v.Npoly) =>
    gateStackState({
      oxideNm: v.tox,
      polyDoping: doping,
      oxideFieldMvCm: field,
      inversionDepthNm: v.Tinv,
    });
  const state = at(v.Eox);
  const fieldSweep = Array.from({ length: 91 }, (_, i) => {
    const field = 0.1 + (i * 2.9) / 90;
    return { field, selected: at(field), strongerGate: at(field, 1e20) };
  });
  const polyDisplay = Math.min(132, Math.max(12, state.polyWidthNm * 2.8));
  const invDisplay = Math.min(50, Math.max(6, v.Tinv * 13));
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'tox',
              label: 'Physical oxide thickness',
              min: 3,
              max: 20,
              step: 0.5,
              unit: 'nm',
            },
            {
              key: 'Npoly',
              label: 'Active poly-Si gate doping',
              min: 1e18,
              max: 1e20,
              step: 1e17,
              log: true,
              unit: 'cm⁻³',
            },
            {
              key: 'Eox',
              label: 'Oxide electric field',
              min: 0.1,
              max: 3,
              step: 0.05,
              unit: 'MV/cm',
            },
            { key: 'Tinv', label: 'Inversion-layer depth', min: 0, max: 4, step: 0.1, unit: 'nm' },
          ]}
        >
          <div className="chips" role="group" aria-label="Gate-stack presets">
            <button
              type="button"
              onClick={() => {
                set('Npoly', 1e18);
                set('Eox', 2);
              }}
            >
              Noticeable poly depletion
            </button>
            <button
              type="button"
              onClick={() => {
                set('Npoly', 1e20);
                set('Eox', 0.7);
              }}
            >
              Heavily doped gate
            </button>
            <button
              type="button"
              onClick={() => {
                set('Tinv', 0);
              }}
            >
              Place inversion sheet at interface
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Electrical thickness of the gate stack"
          forms={[
            {
              label: 'Gate depletion from displacement continuity',
              formula: String.raw`W_{poly}=\frac{\varepsilon_{ox}\mathcal E_{ox}}{qN_{poly}}`,
            },
            {
              label: 'Voltage spent in depleted poly-Si',
              formula: String.raw`V_{poly}=\frac{qN_{poly}W_{poly}^2}{2\varepsilon_{Si}}`,
            },
            {
              label: 'Course effective-thickness approximation',
              formula: String.raw`t_{oxe}\simeq t_{ox}+\frac{W_{poly}}3+\frac{T_{inv}}3,\quad C'_{oxe}\simeq\frac{\varepsilon_{ox}}{t_{oxe}}`,
            },
          ]}
          substitution={String.raw`W_{poly}=${fmt(state.polyWidthNm, 2)}\,\mathrm{nm},\quad t_{oxe}=${fmt(state.effectiveNm, 2)}\,\mathrm{nm}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Raise oxide field or lower active poly-Si doping. The gate depletion region widens, so part
        of the applied voltage drops in the gate. Move the inversion layer deeper into silicon to
        see another reduction in effective gate capacitance.
      </p>
      <Metrics>
        <Metric label="Poly depletion width" value={fmt(state.polyWidthNm, 2)} unit="nm" />
        <Metric label="Poly voltage drop" value={fmt(state.polyVoltage, 3)} unit="V" />
        <Metric label="Effective oxide thickness" value={fmt(state.effectiveNm, 2)} unit="nm" />
        <Metric label="Coxe′ / Cox′" value={fmt(state.capacitanceRatio, 3)} />
      </Metrics>
      <div className="plot-card">
        <div className="plot-title">
          <b>Where the gate voltage and charge separation go</b>
          <span>Depths shown schematically</span>
        </div>
        <svg
          viewBox="0 0 760 205"
          role="img"
          aria-label={`Poly-Si gate depletion ${fmt(state.polyWidthNm, 2)} nanometers, oxide ${fmt(v.tox, 1)} nanometers, inversion depth ${fmt(v.Tinv, 1)} nanometers`}
        >
          <rect x="24" y="43" width="239" height="118" rx="7" fill="#dce7f3" />
          <rect x="263" y="43" width="135" height="118" fill="#fff0d5" />
          <rect x="398" y="43" width="338" height="118" rx="7" fill="#edf8f3" />
          <rect x={263 - polyDisplay} y="45" width={polyDisplay} height="114" fill="#afcae7" />
          <rect x="398" y="45" width={invDisplay} height="114" fill="#b8dfca" />
          <line x1="263" x2="263" y1="42" y2="162" stroke="#9aaeb8" strokeWidth="2" />
          <line x1="398" x2="398" y1="42" y2="162" stroke="#9aaeb8" strokeWidth="2" />
          <text x="115" y="34" fontSize="14" fill="#315477">
            n⁺ poly-Si gate
          </text>
          <text x="294" y="34" fontSize="14" fill="#875e1c">
            SiO₂
          </text>
          <text x="485" y="34" fontSize="14" fill="#2b7052">
            Silicon inversion
          </text>
          <text x="85" y="106" fontSize="12" fill="#315477">
            Wpoly = {fmt(state.polyWidthNm, 1)} nm
          </text>
          <text x="285" y="105" fontSize="12" fill="#875e1c">
            tox = {fmt(v.tox, 1)} nm
          </text>
          <text x="465" y="105" fontSize="12" fill="#2b7052">
            Tinv = {fmt(v.Tinv, 1)} nm
          </text>
          <text x="30" y="189" fontSize="12" fill="#526578">
            Vpoly = {fmt(state.polyVoltage, 3)} V
          </text>
          <text x="255" y="189" fontSize="12" fill="#526578">
            Vox = {fmt(state.oxideVoltage, 3)} V
          </text>
          <text x="463" y="189" fontSize="12" fill="#526578">
            More separation → smaller C
          </text>
        </svg>
      </div>
      <Plot
        title="Effective gate capacitance versus oxide field"
        xLabel="Oxide field (MV/cm)"
        yLabel="Coxe′ / Cox′"
        xDomain={[0.1, 3]}
        yDomain={[0, 1.05]}
        markers={[{ x: v.Eox, label: 'Selected field' }]}
        series={[
          {
            name: 'Selected poly doping',
            color: '#2672d9',
            points: fieldSweep.map((s) => [s.field, s.selected.capacitanceRatio]),
          },
          {
            name: 'Very heavily doped gate',
            color: '#a27636',
            dash: true,
            points: fieldSweep.map((s) => [s.field, s.strongerGate.capacitanceRatio]),
          },
        ]}
      />
      <p className="carrier-motion-summary">
        The drawing is schematic. The (1/3) factors follow the lecture’s effective-thickness
        approximation; the exact capacitance depends on the charge distribution, bias, and gate
        material.
      </p>
    </DemoLayout>
  );
}
