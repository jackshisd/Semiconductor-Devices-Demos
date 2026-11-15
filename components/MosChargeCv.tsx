'use client';

import { useMemo, useState } from 'react';
import { Controls, Toggle } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, sci, useParams } from './Demos';
import Plot from './Plot';
import { mosCvAt } from '../lib/mos-charge-cv';

const gateRange: [number, number] = [-2, 2.5];
const clampGate = (voltage: number) => Math.max(gateRange[0], Math.min(gateRange[1], voltage));

export default function MosChargeCv() {
  const { v, set, reset } = useParams({ VG: 1.2, NA: 1e16, tox: 10, VFB: 0 });
  const [highFrequency, setHighFrequency] = useState(false);
  const params = useMemo(
    () => ({ acceptors: v.NA, oxideNm: v.tox, flatBand: v.VFB }),
    [v.NA, v.tox, v.VFB],
  );
  const sweep = useMemo(
    () =>
      Array.from({ length: 181 }, (_, i) => {
        const voltage = gateRange[0] + (i * (gateRange[1] - gateRange[0])) / 180;
        return { voltage, ...mosCvAt(voltage, params) };
      }),
    [params],
  );
  const state = mosCvAt(v.VG, params);
  const chargeScale = Math.max(0.1, ...sweep.map((s) => Math.abs(s.total * 1e6))) * 1.12;
  const capacitance = highFrequency ? state.highFrequency : state.lowFrequency;
  const region =
    v.VG < v.VFB - 0.02
      ? 'Accumulation: holes gather at the silicon surface.'
      : v.VG < v.VFB + 0.02
        ? 'Flat band: the surface charge is nearly zero.'
        : v.VG < state.threshold
          ? 'Depletion: holes retreat and exposed acceptor ions remain.'
          : 'Inversion: electrons gather above the depleted p-type silicon.';
  const markers = [
    { x: v.VFB, label: 'Flat band' },
    { x: state.threshold, label: 'Threshold' },
    { x: v.VG, label: 'Selected gate' },
  ];
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setHighFrequency(false);
          }}
          items={[
            {
              key: 'VG',
              label: 'Gate voltage',
              min: gateRange[0],
              max: gateRange[1],
              step: 0.01,
              unit: 'V',
            },
            {
              key: 'NA',
              label: 'P-type acceptor density',
              min: 1e15,
              max: 1e17,
              step: 1e14,
              log: true,
              unit: 'cm⁻³',
            },
            { key: 'tox', label: 'Oxide thickness', min: 5, max: 20, step: 0.5, unit: 'nm' },
            { key: 'VFB', label: 'Flat-band voltage', min: -0.5, max: 0.5, step: 0.01, unit: 'V' },
          ]}
        >
          <div className="chips" role="group" aria-label="MOS operating region presets">
            <button type="button" onClick={() => set('VG', clampGate(v.VFB - 0.8))}>
              Accumulation
            </button>
            <button type="button" onClick={() => set('VG', clampGate(v.VFB))}>
              Flat band
            </button>
            <button
              type="button"
              onClick={() => set('VG', clampGate((v.VFB + state.threshold) / 2))}
            >
              Depletion
            </button>
            <button type="button" onClick={() => set('VG', clampGate(state.threshold + 0.7))}>
              Inversion
            </button>
          </div>
          <Toggle label="High-frequency C–V" checked={highFrequency} onChange={setHighFrequency} />
        </Controls>
      }
      calculation={
        <Calculation
          title="How charge creates the C–V curve"
          forms={[
            { label: 'Total silicon charge', formula: String.raw`Q_s'=Q_{acc}'+Q_{dep}'+Q_{inv}'` },
            {
              label: 'Depletion approximation',
              formula: String.raw`Q_{dep}'\simeq-qN_AW,\qquad W\simeq\sqrt{\frac{2\varepsilon_{Si}\psi_s}{qN_A}}`,
            },
            {
              label: 'Small-signal response',
              formula: String.raw`C'=\left|\frac{dQ_s'}{dV_G}\right|,\qquad C_{ox}'=\frac{\varepsilon_{ox}}{t_{ox}}`,
            },
          ]}
          substitution={String.raw`Q_s'=${fmt(state.total * 1e6, 3)}\,\mu\mathrm{C/cm^2},\quad C'/C_{ox}'=${fmt(capacitance / state.oxideCapacitance, 3)}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Sweep the gate voltage. The top plot separates accumulated holes, exposed acceptor ions, and
        inversion electrons. The lower plot shows how the slope of total charge becomes the measured
        capacitance. Switch frequency to see whether inversion electrons can follow the AC signal.
      </p>
      <p className="capacitance-dominance" role="status">
        {region}
      </p>
      <Metrics>
        <Metric label="Surface potential ψₛ" value={fmt(state.surfacePotential, 3)} unit="V" />
        <Metric label="Total silicon charge Qₛ′" value={fmt(state.total * 1e6, 3)} unit="µC/cm²" />
        <Metric label="Selected capacitance" value={sci(capacitance * 1e9)} unit="nF/cm²" />
        <Metric label="Threshold Vₜ" value={fmt(state.threshold, 3)} unit="V" />
      </Metrics>
      <Plot
        title="Silicon charge components versus gate voltage"
        xLabel="Gate voltage Vᴳ (V)"
        yLabel="Charge density (µC/cm²)"
        xDomain={gateRange}
        yDomain={[-chargeScale, chargeScale]}
        height={330}
        markers={markers}
        series={[
          {
            name: 'Holes · Qacc',
            color: '#d18a23',
            points: sweep.map((s) => [s.voltage, s.accumulation * 1e6]),
          },
          {
            name: 'Acceptors · Qdep',
            color: '#2672d9',
            points: sweep.map((s) => [s.voltage, s.depletion * 1e6]),
          },
          {
            name: 'Electrons · Qinv',
            color: '#7654ba',
            points: sweep.map((s) => [s.voltage, s.inversion * 1e6]),
          },
          {
            name: 'Total · Qs',
            color: '#14875f',
            points: sweep.map((s) => [s.voltage, s.total * 1e6]),
          },
        ]}
        onInspect={(voltage) =>
          `At ${fmt(voltage, 2)} V: Qs = ${fmt(mosCvAt(voltage, params).total * 1e6, 3)} µC/cm²`
        }
      />
      <Plot
        title="MOS capacitance versus gate voltage"
        xLabel="Gate voltage Vᴳ (V)"
        yLabel="C / Cox"
        xDomain={gateRange}
        yDomain={[0, 1.05]}
        height={330}
        markers={markers}
        series={[
          {
            name: 'Low frequency',
            color: '#14875f',
            points: sweep.map((s) => [s.voltage, s.lowFrequency / s.oxideCapacitance]),
            dash: highFrequency,
          },
          {
            name: 'High frequency',
            color: '#7654ba',
            points: sweep.map((s) => [s.voltage, s.highFrequency / s.oxideCapacitance]),
            dash: !highFrequency,
          },
        ]}
        onInspect={(voltage) => {
          const at = mosCvAt(voltage, params);
          return `At ${fmt(voltage, 2)} V: low ${fmt(at.lowFrequency / at.oxideCapacitance, 3)}, high ${fmt(at.highFrequency / at.oxideCapacitance, 3)} × Cox`;
        }}
      />
      <p className="carrier-motion-summary">
        In accumulation, mobile holes follow the AC voltage, giving capacitance near Cₒₓ. In
        depletion, widening the space-charge region adds a series capacitance, so C falls. In
        inversion, low-frequency minority electrons can respond and C rises again; at high frequency
        they cannot, so C remains near its minimum. The model assumes an ideal, equilibrium p-type
        capacitor at 300 K and omits interface traps and oxide charge.
      </p>
    </DemoLayout>
  );
}
