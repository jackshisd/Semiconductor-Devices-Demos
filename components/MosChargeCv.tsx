'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, sci, useParams } from './Demos';
import Plot from './Plot';
import MosCvCarrierScene from './MosCvCarrierScene';
import {
  measuredMosCapacitance,
  minorityResponse,
  minorityResponseFrequency,
  mosCvAt,
} from '../lib/mos-charge-cv';

const gateRange: [number, number] = [-2, 2.5];
const clampGate = (voltage: number) => Math.max(gateRange[0], Math.min(gateRange[1], voltage));

export default function MosChargeCv() {
  const { v, set, reset } = useParams({ VG: 1.2, NA: 1e16, tox: 10, VFB: 0, frequency: 10 });
  const [running, setRunning] = useState(true);
  const [sweeping, setSweeping] = useState(false);
  const sweepStart = useRef<number | null>(null);
  const setRef = useRef(set);
  setRef.current = set;
  useEffect(() => {
    if (!running || !sweeping) return;
    let frame = 0;
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (now - lastUpdate >= 33) {
        const progress = ((now - (sweepStart.current ?? now)) / 12000) % 1;
        const fraction = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        setRef.current('VG', Math.round((gateRange[0] + fraction * 4.5) * 100) / 100);
        lastUpdate = now;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [running, sweeping]);
  const setControl = (key: string, value: number) => {
    if (key === 'VG') setSweeping(false);
    set(key, value);
  };
  const setGate = (value: number) => {
    setSweeping(false);
    set('VG', clampGate(value));
  };
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
  const response = minorityResponse(v.frequency);
  const capacitance = measuredMosCapacitance(state.lowFrequency, state.highFrequency, v.frequency);
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
          set={setControl}
          reset={() => {
            reset();
            setSweeping(false);
            setRunning(true);
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
            {
              key: 'frequency',
              label: 'AC probe frequency',
              min: 0.1,
              max: 1e6,
              step: 0.1,
              log: true,
              unit: 'Hz',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="MOS operating region presets">
            <button type="button" onClick={() => setGate(v.VFB - 0.8)}>
              Accumulation
            </button>
            <button type="button" onClick={() => setGate(v.VFB)}>
              Flat band
            </button>
            <button type="button" onClick={() => setGate((v.VFB + state.threshold) / 2)}>
              Depletion
            </button>
            <button type="button" onClick={() => setGate(state.threshold + 0.7)}>
              Inversion
            </button>
          </div>
          <div className="chips" role="group" aria-label="Probe frequency presets">
            <button type="button" onClick={() => set('frequency', 10)}>
              Slow probe · 10 Hz
            </button>
            <button type="button" onClick={() => set('frequency', 1e6)}>
              Fast probe · 1 MHz
            </button>
          </div>
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
              formula: String.raw`C'(f)=\left|\frac{\delta Q_s'(f)}{\delta V_G}\right|,\qquad C_{ox}'=\frac{\varepsilon_{ox}}{t_{ox}}`,
            },
            {
              label: 'AC charge swing for a small probe',
              formula: String.raw`\Delta Q_s'\approx C'(V_G,f)\,\Delta V_G`,
            },
          ]}
          substitution={String.raw`Q_s'=${fmt(state.total * 1e6, 3)}\,\mu\mathrm{C/cm^2},\quad C'/C_{ox}'=${fmt(capacitance / state.oxideCapacitance, 3)}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Play a DC gate sweep or choose a bias. A small AC probe then makes charge move. The
        small-signal charge change sets capacitance; probe frequency determines whether inversion
        electrons can contribute to that motion.
      </p>
      <p className="capacitance-dominance" role="status">
        {region}
      </p>
      <Metrics>
        <Metric label="Surface potential ψₛ" value={fmt(state.surfacePotential, 3)} unit="V" />
        <Metric label="Total silicon charge Qₛ′" value={fmt(state.total * 1e6, 3)} unit="µC/cm²" />
        <Metric label="Selected capacitance" value={sci(capacitance * 1e9)} unit="nF/cm²" />
        <Metric label="Threshold Vₜ" value={fmt(state.threshold, 3)} unit="V" />
        <Metric
          label="AC charge swing · 50 mV"
          value={fmt(capacitance * 0.05 * 1e9, 2)}
          unit="nC/cm²"
        />
      </Metrics>
      <div className="chips mos-cv-playback" role="group" aria-label="Animation controls">
        <button
          type="button"
          aria-pressed={running}
          className={running ? 'active' : undefined}
          onClick={() => {
            if (running) setSweeping(false);
            setRunning((old) => !old);
          }}
        >
          {running ? 'Pause animation' : 'Play animation'}
        </button>
        <button
          type="button"
          aria-pressed={sweeping}
          className={sweeping ? 'active' : undefined}
          onClick={() => {
            if (!sweeping) {
              sweepStart.current = performance.now();
              setRunning(true);
            }
            setSweeping((old) => !old);
          }}
        >
          {sweeping ? 'Stop gate sweep' : 'Play gate sweep'}
        </button>
      </div>
      <MosCvCarrierScene
        gateVoltage={v.VG}
        flatBand={v.VFB}
        threshold={state.threshold}
        depletionWidth={state.depletionWidth}
        thresholdWidth={mosCvAt(state.threshold, params).depletionWidth}
        response={response}
        running={running}
        frequencyHz={v.frequency}
      />
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
        title="Measured C–V curve at the selected probe frequency"
        xLabel="Gate voltage Vᴳ (V)"
        yLabel="C / Cox"
        xDomain={gateRange}
        yDomain={[0, 1.05]}
        height={330}
        markers={markers}
        points={[
          {
            x: v.VG,
            y: capacitance / state.oxideCapacitance,
            label: `C/Cox = ${fmt(capacitance / state.oxideCapacitance, 2)}`,
            color: '#d56138',
          },
        ]}
        series={[
          {
            name: 'Selected frequency',
            color: '#d56138',
            points: sweep.map((s) => [
              s.voltage,
              measuredMosCapacitance(s.lowFrequency, s.highFrequency, v.frequency) /
                s.oxideCapacitance,
            ]),
          },
          {
            name: 'Slow-probe limit',
            color: '#14875f',
            points: sweep.map((s) => [s.voltage, s.lowFrequency / s.oxideCapacitance]),
            dash: true,
          },
          {
            name: 'Fast-probe limit',
            color: '#7654ba',
            points: sweep.map((s) => [s.voltage, s.highFrequency / s.oxideCapacitance]),
            dash: true,
          },
        ]}
        onInspect={(voltage) => {
          const at = mosCvAt(voltage, params);
          const measured = measuredMosCapacitance(at.lowFrequency, at.highFrequency, v.frequency);
          return `At ${fmt(voltage, 2)} V: measured C/Cox = ${fmt(measured / at.oxideCapacitance, 3)} at ${fmt(v.frequency, v.frequency < 10 ? 2 : 0)} Hz`;
        }}
      />
      <p className="carrier-motion-summary">
        In accumulation, mobile holes follow the AC voltage, giving capacitance near Cₒₓ. In
        depletion, widening the space-charge region adds a series capacitance, so C falls. In
        inversion, low-frequency minority electrons can respond and C rises again; at high frequency
        they cannot, so C remains near its minimum. The selected curve interpolates between those
        limits using an illustrative {sci(minorityResponseFrequency)} Hz response crossover; it is
        not a measured frequency law. The model assumes an ideal p-type capacitor at 300 K and omits
        interface traps and oxide charge.
      </p>
    </DemoLayout>
  );
}
