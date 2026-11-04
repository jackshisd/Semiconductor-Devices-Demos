'use client';

import { useEffect, useState } from 'react';
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
import { smallSignalDiode } from '../lib/small-signal-diode';

export default function SmallSignalDiode() {
  const { v, set, reset } = useParams({ VDC: 0.42, amplitude: 5, frequency: 1e6, C: 30 });
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (previous && now - previous >= 30) {
        setPhase(
          (old) => (old + Math.min((now - previous) / 1000, 0.1) * Math.PI * 0.8) % (4 * Math.PI),
        );
        previous = now;
      } else if (!previous) previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  const model = smallSignalDiode({
    dcVoltage: v.VDC,
    acAmplitude: v.amplitude * 1e-3,
    frequency: v.frequency,
    capacitance: v.C * 1e-12,
  });
  const now = model.atPhase(phase);
  const cycles = pts(0, 2, 160, (cycle) => cycle);
  const currentRange = Math.max(1e-6, 1.2 * model.totalAmplitude * 1e6);
  const vMin = Math.max(0, v.VDC - 0.05);
  const vMax = v.VDC + 0.05;
  const curve = pts(vMin, vMax, 120, model.diodeCurrent).map(
    ([voltage, current]) => [voltage, current * 1e6] as [number, number],
  );
  const tangent = pts(vMin, vMax, 2, model.tangentCurrent).map(
    ([voltage, current]) => [voltage, current * 1e6] as [number, number],
  );
  const ivMin = Math.min(0, curve[0][1], tangent[0][1]);
  const ivMax = Math.max(curve.at(-1)![1], tangent.at(-1)![1]);
  const periodMicroS = 1e6 / v.frequency;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setPhase(0);
            setPlaying(true);
          }}
          items={[
            { key: 'VDC', label: 'Forward DC bias', min: 0.3, max: 0.55, step: 0.005, unit: 'V' },
            {
              key: 'amplitude',
              label: 'AC voltage amplitude',
              min: 1,
              max: 15,
              step: 0.5,
              unit: 'mV',
            },
            {
              key: 'frequency',
              label: 'AC frequency',
              min: 1e3,
              max: 1e7,
              step: 1e3,
              unit: 'Hz',
              log: true,
            },
            { key: 'C', label: 'Parallel capacitance', min: 0, max: 100, step: 1, unit: 'pF' },
          ]}
        >
          <button type="button" className="reset-button" onClick={() => setPlaying((old) => !old)}>
            {playing ? 'Pause waveform' : 'Play waveform'}
          </button>
        </Controls>
      }
      calculation={
        <Calculation
          title="Local small-signal model at 300 K"
          forms={[
            {
              label: 'Linearized diode conductance',
              formula: String.raw`G=\frac1R=\left.\frac{dI}{dV}\right|_{V_{DC}}=\frac{I_0e^{V_{DC}/V_T}}{V_T}\approx\frac{I_{DC}}{V_T}`,
            },
            {
              label: 'Parallel resistor and capacitor currents',
              formula: String.raw`v_a(t)=\hat v\sin(\omega t),\qquad i(t)=Gv_a(t)+C\frac{dv_a}{dt}`,
            },
          ]}
          substitution={String.raw`I_{DC}=${texSci(model.dcCurrent)}\,\mathrm A,\quad R=${texSci(model.resistance)}\,\Omega,\quad C=${fmt(v.C, 0)}\,\mathrm{pF}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        The DC bias selects a point on the diode curve. A small AC voltage moves around that point:
        the resistor current follows voltage, while the capacitor current follows how fast voltage
        changes.
      </p>
      <Metrics>
        <Metric label="DC diode current" value={sci(model.dcCurrent * 1e6)} unit="µA" />
        <Metric label="Small-signal resistance" value={sci(model.resistance)} unit="Ω" />
        <Metric
          label="Resistor current amplitude"
          value={sci(model.resistiveAmplitude * 1e6)}
          unit="µA"
        />
        <Metric
          label="Capacitor current amplitude"
          value={sci(model.capacitiveAmplitude * 1e6)}
          unit="µA"
        />
        <Metric
          label="Current lead over voltage"
          value={fmt((model.phaseLead * 180) / Math.PI, 1)}
          unit="degrees"
        />
      </Metrics>
      <section
        className="small-signal-circuit"
        aria-label="Parallel resistance and capacitance circuit"
      >
        <svg
          viewBox="0 0 560 225"
          role="img"
          aria-label={`AC source driving parallel resistor ${sci(model.resistance)} ohms and capacitor ${fmt(v.C, 0)} picofarads`}
        >
          <path
            d="M100 55 H455 M100 185 H455 M100 55 V81 M100 159 V185"
            fill="none"
            stroke="#486474"
            strokeWidth="4"
          />
          <circle cx="100" cy="120" r="39" fill="#f3f8fb" stroke="#2672d9" strokeWidth="4" />
          <path d="M74 120 Q87 99 100 120 T126 120" fill="none" stroke="#2672d9" strokeWidth="4" />
          <path
            d="M275 55 V77 L262 86 L288 100 L262 114 L288 128 L262 142 L275 151 V185"
            fill="none"
            stroke="#d47748"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M455 55 V101 M425 101 H485 M425 119 H485 M455 119 V185"
            fill="none"
            stroke="#298474"
            strokeWidth="4"
          />
          <circle
            cx="275"
            cy={
              now.resistiveCurrent >= 0
                ? 84 + ((phase % (2 * Math.PI)) / (2 * Math.PI)) * 65
                : 149 - ((phase % (2 * Math.PI)) / (2 * Math.PI)) * 65
            }
            r="6"
            fill="#d47748"
          />
          {v.C > 0 && (
            <circle cx="455" cy={now.capacitiveCurrent >= 0 ? 61 : 175} r="6" fill="#298474" />
          )}
          <text x="276" y="42" textAnchor="middle" fill="#965632" fontSize="17" fontWeight="700">
            R = {sci(model.resistance)} Ω
          </text>
          <text x="455" y="42" textAnchor="middle" fill="#26705f" fontSize="17" fontWeight="700">
            C = {fmt(v.C, 0)} pF
          </text>
          <text x="100" y="207" textAnchor="middle" fill="#246c9d" fontSize="17" fontWeight="700">
            vₐ(t)
          </text>
        </svg>
        <div className="small-signal-live" aria-live="off">
          <span>Now: vₐ = {fmt(now.acVoltage * 1e3, 2)} mV</span>
          <span>iᵣ = {fmt(now.resistiveCurrent * 1e6, 3)} µA</span>
          <span>i꜀ = {fmt(now.capacitiveCurrent * 1e6, 3)} µA</span>
          <strong>i = {fmt(now.totalCurrent * 1e6, 3)} µA</strong>
        </div>
      </section>
      <div className="small-signal-graphs">
        <Plot
          title="AC voltage and the moving operating point"
          xLabel={`Time (cycles; one cycle = ${sci(periodMicroS)} µs)`}
          yLabel="AC voltage (mV)"
          xDomain={[0, 2]}
          yDomain={[-v.amplitude * 1.2, v.amplitude * 1.2]}
          height={260}
          series={[
            {
              name: 'vₐ',
              color: '#2672d9',
              points: cycles.map(([cycle]) => [
                cycle,
                model.atPhase(2 * Math.PI * cycle).acVoltage * 1e3,
              ]),
            },
          ]}
          markers={[{ x: phase / (2 * Math.PI), label: 'Now' }]}
        />
        <Plot
          title="Instantaneous current splits between R and C"
          xLabel="Time (cycles)"
          yLabel="AC current (µA)"
          xDomain={[0, 2]}
          yDomain={[-currentRange, currentRange]}
          height={290}
          series={[
            {
              name: 'iᵣ = vₐ/R',
              color: '#d47748',
              points: cycles.map(([cycle]) => [
                cycle,
                model.atPhase(2 * Math.PI * cycle).resistiveCurrent * 1e6,
              ]),
            },
            {
              name: 'i꜀ = C dvₐ/dt',
              color: '#298474',
              points: cycles.map(([cycle]) => [
                cycle,
                model.atPhase(2 * Math.PI * cycle).capacitiveCurrent * 1e6,
              ]),
            },
            {
              name: 'i = iᵣ + i꜀',
              color: '#2672d9',
              points: cycles.map(([cycle]) => [
                cycle,
                model.atPhase(2 * Math.PI * cycle).totalCurrent * 1e6,
              ]),
            },
          ]}
          markers={[{ x: phase / (2 * Math.PI), label: 'Now' }]}
        />
        <Plot
          title="The resistor is the tangent to the diode I–V curve"
          xLabel="Junction voltage (V)"
          yLabel="DC diode current (µA)"
          xDomain={[vMin, vMax]}
          yDomain={[ivMin < 0 ? ivMin * 1.08 : 0, ivMax * 1.08]}
          height={290}
          series={[
            { name: 'Ideal diode', color: '#2672d9', points: curve },
            { name: 'Local tangent · slope G', color: '#d47748', dash: true, points: tangent },
          ]}
          points={[{ x: v.VDC, y: model.dcCurrent * 1e6, label: 'DC bias', color: '#2672d9' }]}
        />
      </div>
      <p className="teaching-caption">
        The waveform playback is slowed; frequency changes the capacitor current and the physical
        period shown on the axis. The tangent is accurate only close to the DC bias. This ideal
        model uses I₀ = 1 pA at 300 K and a selected parallel capacitance; it omits series
        resistance and other nonideal diode effects.
      </p>
    </DemoLayout>
  );
}
