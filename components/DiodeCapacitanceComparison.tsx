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
import { diodeCapacitances } from '../lib/diode-capacitances';

export default function DiodeCapacitanceComparison() {
  const { v, set, reset } = useParams({ VA: 0.45, ND: 1e16, area: 1e-4, tau: 1e-6 });
  const at = (voltage: number) =>
    diodeCapacitances({
      donorDensity: v.ND,
      area: v.area,
      lifetime: v.tau,
      voltage,
    });
  const state = at(v.VA);
  const reverseWidth = at(-2).depletionWidth;
  const depletionVisualWidth = 36 + (110 * state.depletionWidth) / reverseWidth;
  const cloudStrength = Math.min(1, Math.max(0, Math.log10(1 + state.holeEdgeExcess / 1e5) / 7));
  const total = state.totalCapacitance;
  const junctionShare = (100 * state.junctionCapacitance) / total;
  const diffusionShare = (100 * state.diffusionCapacitance) / total;
  const samples = pts(-2, 0.55, 160, (voltage) => voltage).map(([voltage]) => ({
    voltage,
    ...at(voltage),
  }));
  const logPf = (farads: number) => Math.log10(Math.max(1e-9, farads * 1e12));
  const dominant =
    diffusionShare > 50 ? 'Diffusion capacitance dominates' : 'Depletion capacitance dominates';
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
              min: -2,
              max: 0.55,
              step: 0.01,
              unit: 'V',
            },
            {
              key: 'ND',
              label: 'Light n-side donors',
              min: 1e15,
              max: 1e17,
              step: 1e14,
              unit: 'cm⁻³',
              log: true,
            },
            {
              key: 'area',
              label: 'Junction area',
              min: 1e-5,
              max: 1e-3,
              step: 1e-6,
              unit: 'cm²',
              log: true,
            },
            {
              key: 'tau',
              label: 'Hole lifetime',
              min: 1e-7,
              max: 1e-5,
              step: 1e-8,
              unit: 's',
              log: true,
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Bias presets">
            <button type="button" onClick={() => set('VA', -1)}>
              Reverse bias
            </button>
            <button type="button" onClick={() => set('VA', 0)}>
              Zero bias
            </button>
            <button type="button" onClick={() => set('VA', 0.45)}>
              Low forward
            </button>
            <button type="button" onClick={() => set('VA', 0.55)}>
              Higher forward
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Two sources of small-signal charge at 300 K"
          forms={[
            {
              label: 'Depletion-region charge responds through width W',
              formula: String.raw`C_J=\left|\frac{dQ_{\rm dep}}{dV_A}\right|=\frac{\varepsilon_s A}{W}`,
            },
            {
              label: 'Injected minority charge responds in the neutral base',
              formula: String.raw`C_D=\frac{dQ_p}{dV_A}=\tau_p\frac{dI}{dV_A}=\tau_p G,\qquad C_{\rm total}=C_J+C_D`,
            },
          ]}
          substitution={String.raw`C_J=${texSci(state.junctionCapacitance * 1e12)}\,\mathrm{pF},\quad C_D=${texSci(state.diffusionCapacitance * 1e12)}\,\mathrm{pF}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Both capacitances measure how charge changes when junction voltage changes. Depletion
        capacitance follows the space-charge width; diffusion capacitance follows stored injected
        minority holes in the neutral n region.
      </p>
      <Metrics>
        <Metric
          label="Depletion capacitance Cⱼ"
          value={sci(state.junctionCapacitance * 1e12)}
          unit="pF"
        />
        <Metric
          label="Diffusion capacitance Cᴅ"
          value={sci(state.diffusionCapacitance * 1e12)}
          unit="pF"
        />
        <Metric label="Total capacitance" value={sci(total * 1e12)} unit="pF" />
        <Metric label="Depletion width W" value={fmt(state.depletionWidth * 1e4, 3)} unit="µm" />
      </Metrics>
      <p className="capacitance-dominance" role="status">
        {dominant} at {fmt(v.VA, 2)} V.
      </p>
      <div className="diode-capacitance-panels">
        <section className="diode-capacitance-card">
          <h2>Depletion capacitance · Cⱼ</h2>
          <div
            className="capacitance-junction"
            aria-label={`Depletion width ${fmt(state.depletionWidth * 1e4, 3)} micrometers`}
          >
            <span className="capacitance-p-region">p⁺</span>
            <span className="capacitance-depletion" style={{ width: depletionVisualWidth }}>
              <span>− | +</span>
            </span>
            <span className="capacitance-n-region">n</span>
          </div>
          <p>
            Reverse bias widens the depleted region, reducing Cⱼ. Forward bias narrows it, so Cⱼ
            rises gradually.
          </p>
          <strong>W = {fmt(state.depletionWidth * 1e4, 3)} µm</strong>
        </section>
        <section className="diode-capacitance-card">
          <h2>Diffusion capacitance · Cᴅ</h2>
          <div
            className="capacitance-diffusion"
            aria-label={`Stored excess hole charge ${sci(state.storedExcessCharge)} coulombs`}
          >
            <span>junction edge</span>
            <div className="capacitance-diffusion-track">
              <span style={{ width: `${cloudStrength * 100}%` }} />
            </div>
            <span>n-type neutral base →</span>
          </div>
          <p>
            {v.VA > 0
              ? 'Forward bias injects holes that spread into the base. Their stored charge changes rapidly with voltage.'
              : 'At zero or reverse bias there is no forward-injected hole cloud; negative excess charge means a deficit relative to equilibrium.'}
          </p>
          <strong>Excess Qₚ = {sci(state.storedExcessCharge)} C</strong>
        </section>
      </div>
      <section className="capacitance-share" aria-label="Current capacitance contributions">
        <div>
          <span>Cⱼ share</span>
          <strong>{fmt(junctionShare, 1)}%</strong>
        </div>
        <div className="capacitance-share-bar">
          <span style={{ width: `${junctionShare}%` }} />
          <span style={{ width: `${diffusionShare}%` }} />
        </div>
        <div>
          <span>Cᴅ share</span>
          <strong>{fmt(diffusionShare, 1)}%</strong>
        </div>
      </section>
      <Plot
        title="How the two capacitances change with bias"
        xLabel="Applied bias Vₐ (V)"
        yLabel="log₁₀(capacitance / pF)"
        xDomain={[-2, 0.55]}
        yDomain={[-9, 6]}
        height={350}
        series={[
          {
            name: 'Cⱼ · depletion',
            color: '#2672d9',
            points: samples.map((s) => [s.voltage, logPf(s.junctionCapacitance)]),
          },
          {
            name: 'Cᴅ · diffusion',
            color: '#d47748',
            points: samples.map((s) => [s.voltage, logPf(s.diffusionCapacitance)]),
          },
          {
            name: 'Cⱼ + Cᴅ',
            color: '#298474',
            dash: true,
            points: samples.map((s) => [s.voltage, logPf(s.totalCapacitance)]),
          },
        ]}
        markers={[{ x: v.VA, label: 'Selected bias' }]}
        onInspect={(voltage) => {
          const sample = at(voltage);
          return `Vₐ ${fmt(voltage, 2)} V · Cⱼ ${sci(sample.junctionCapacitance * 1e12)} pF · Cᴅ ${sci(sample.diffusionCapacitance * 1e12)} pF`;
        }}
      />
      <p className="teaching-caption">
        The diagram sizes are schematic. The graph clips capacitances below 10⁻⁹ pF to its lower
        display limit. This quasi-static, low-level model uses a p⁺n junction with Nₐ = 10¹⁸ cm⁻³,
        hole diffusivity 11 cm²/s, and a long n-type base. It omits series resistance and high-level
        injection.
      </p>
    </DemoLayout>
  );
}
