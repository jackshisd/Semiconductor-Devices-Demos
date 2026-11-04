'use client';

import { useEffect, useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, pts, useParams } from './Demos';
import Plot from './Plot';
import { diodeTurnOff } from '../lib/diode-turnoff';

export default function DiodeTurnOff() {
  const { v, set, reset } = useParams({ IF: 10, IR: 5, tau: 2 });
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const model = diodeTurnOff({ forwardCurrent: v.IF, reverseCurrent: v.IR, lifetime: v.tau });
  const end = model.storageDelay + 4 * model.illustrativeRecoveryTime;
  const start = -Math.max(0.5, end * 0.16);
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (previous && now - previous >= 30) {
        const delta = Math.min((now - previous) / 1000, 0.1);
        setTime((old) => (old + (delta * end) / 7 > end ? 0 : old + (delta * end) / 7));
        previous = now;
      } else if (!previous) previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, end]);
  const edit = (key: string, value: number) => {
    set(key, value);
    setTime(0);
  };
  const current = model.at(time);
  const timeline = pts(start, end, 240, (t) => t).map(([t]) => ({ t, ...model.at(t) }));
  const marks = [
    { x: 0, label: 'Reverse step' },
    { x: model.storageDelay, label: 'tₛ' },
  ];
  const zones = [{ from: 0, to: model.storageDelay, color: '#fff3e7' }];
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={edit}
          reset={() => {
            reset();
            setTime(0);
            setPlaying(true);
          }}
          items={[
            {
              key: 'IF',
              label: 'Previous forward current Iꜰ',
              min: 1,
              max: 20,
              step: 0.5,
              unit: 'mA',
            },
            {
              key: 'IR',
              label: 'Reverse extraction current Iʀ',
              min: 1,
              max: 20,
              step: 0.5,
              unit: 'mA',
            },
            {
              key: 'tau',
              label: 'Minority-carrier lifetime τₚ',
              min: 0.2,
              max: 5,
              step: 0.1,
              unit: 'µs',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Turn-off playback">
            <button type="button" onClick={() => setPlaying((old) => !old)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTime(0);
                setPlaying(true);
              }}
            >
              Replay reverse step
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Charge-control storage delay"
          forms={[
            {
              label: 'Stored holes are extracted and recombine',
              formula: String.raw`Q_p(0)=I_F\tau_p,\qquad\frac{dQ_p}{dt}=-I_R-\frac{Q_p}{\tau_p}`,
            },
            {
              label: 'Time to remove stored excess charge',
              formula: String.raw`t_s=\tau_p\ln\!\left(1+\frac{I_F}{I_R}\right)`,
            },
          ]}
          substitution={String.raw`I_F=${fmt(v.IF, 1)}\,\mathrm{mA},\quad I_R=${fmt(v.IR, 1)}\,\mathrm{mA},\quad t_s=${fmt(model.storageDelay, 2)}\,\mu\mathrm s`}
        />
      }
    >
      <p className="carrier-motion-summary">
        A diode carrying forward current stores excess minority holes. At t = 0 the circuit demands
        reverse current, but the diode keeps conducting while those holes are removed. Turn the
        controls to see how long this storage interval lasts.
      </p>
      <Metrics>
        <Metric label="Initial stored charge" value={fmt(model.initialCharge, 2)} unit="nC" />
        <Metric label="Storage delay tₛ" value={fmt(model.storageDelay, 2)} unit="µs" />
        <Metric label="Remaining excess charge" value={fmt(current.charge, 2)} unit="nC" />
        <Metric label="Diode current now" value={fmt(current.current, 2)} unit="mA" />
      </Metrics>
      <div className="turnoff-stage" aria-live="off">
        {current.stage === 'storage'
          ? `Storage interval · reverse current extracts holes while recombination also removes them. ${fmt(Math.max(0, model.storageDelay - time), 2)} µs until stored charge reaches zero.`
          : current.stage === 'recovery'
            ? 'Stored excess charge is gone. The illustrated reverse-current tail decays toward blocking.'
            : 'Forward-biased steady state before the switching command.'}
      </div>
      <div className="turnoff-graphs">
        <Plot
          title="Turn-off current and reverse-recovery tail"
          xLabel="Time after switching (µs)"
          yLabel="Diode current (mA)"
          xDomain={[start, end]}
          yDomain={[-1.2 * v.IR, 1.2 * v.IF]}
          height={310}
          zones={zones}
          series={[
            {
              name: 'i(t)',
              color: '#2672d9',
              points: timeline.map((point) => [point.t, point.current]),
            },
          ]}
          markers={[...marks, { x: time, label: 'Now' }]}
          onInspect={(t) => `t ${fmt(t, 2)} µs · current ${fmt(model.at(t).current, 2)} mA`}
        />
        <Plot
          title="Excess minority charge is removed during storage"
          xLabel="Time after switching (µs)"
          yLabel="Stored Qₚ (nC)"
          xDomain={[start, end]}
          yDomain={[0, 1.15 * model.initialCharge]}
          height={290}
          zones={zones}
          series={[
            {
              name: 'Qₚ(t)',
              color: '#d47748',
              points: timeline.map((point) => [point.t, point.charge]),
              areaTo: 0,
            },
          ]}
          markers={[...marks, { x: time, label: 'Now' }]}
          onInspect={(t) => `t ${fmt(t, 2)} µs · stored charge ${fmt(model.at(t).charge, 2)} nC`}
        />
        <Plot
          title="Junction voltage follows the stored charge"
          xLabel="Time after switching (µs)"
          yLabel="Junction voltage (V)"
          xDomain={[start, end]}
          yDomain={[-2.2, 0.8]}
          height={290}
          zones={zones}
          series={[
            {
              name: 'vₐ(t) · illustrative',
              color: '#298474',
              points: timeline.map((point) => [point.t, point.voltage]),
            },
          ]}
          markers={[...marks, { x: time, label: 'Now' }]}
          onInspect={(t) => `t ${fmt(t, 2)} µs · junction voltage ${fmt(model.at(t).voltage, 2)} V`}
        />
      </div>
      <p className="teaching-caption">
        The orange interval is the charge-control storage period. Its delay follows the slide’s
        long-base formula. The post-storage current tail and reverse-voltage approach use an
        illustrative 0.35τₚ time constant; the lecture’s storage equation does not determine their
        exact shapes. Waveform playback is slowed for visibility.
      </p>
    </DemoLayout>
  );
}
