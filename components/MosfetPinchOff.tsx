'use client';

import { useEffect, useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, useParams } from './Demos';
import Plot from './Plot';
import { mosfetOutput } from '../lib/mosfet-output';

const threshold = 0.8;
const beta = 1; // Illustrative mA/V².
const maxDrainVoltage = 5;

function ChannelScene({
  gateVoltage,
  drainVoltage,
  lambda,
  playing,
}: {
  gateVoltage: number;
  drainVoltage: number;
  lambda: number;
  playing: boolean;
}) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!playing || drainVoltage <= 0 || gateVoltage <= threshold) return;
    const timer = window.setInterval(() => setPhase((old) => (old + 0.012) % 1), 45);
    return () => window.clearInterval(timer);
  }, [playing, drainVoltage, gateVoltage]);
  const state = mosfetOutput(gateVoltage, drainVoltage, threshold, beta, lambda);
  const on = state.region !== 'off';
  const sourceEdge = 112;
  const drainEdge = 526;
  // Reserve a small schematic drain-side depleted segment even in the ideal
  // saturation model, whose current intentionally stays flat.
  const visibleChannelRatio = state.region === 'saturation' ? 0.92 * state.effectiveLengthRatio : 1;
  const channelEnd = sourceEdge + (drainEdge - sourceEdge) * visibleChannelRatio;
  const channelStartY = 165;
  const thickness = Math.min(24, 8 + 9 * state.overdrive);
  const drainThickness =
    state.region === 'linear'
      ? Math.max(3, thickness * (1 - drainVoltage / Math.max(state.overdrive, 0.01)))
      : 1;
  const path = `M ${sourceEdge} ${channelStartY} L ${channelEnd} ${channelStartY} L ${channelEnd} ${channelStartY + drainThickness} L ${sourceEdge} ${channelStartY + thickness} Z`;
  return (
    <div className="plot-card mosfet-scene">
      <div className="plot-title">
        <b>NMOS channel and moving electrons</b>
        <span>Side view · schematic</span>
      </div>
      <svg
        viewBox="0 0 640 260"
        role="img"
        aria-label={`NMOS ${state.region}; schematic electron channel reaches ${Math.round(visibleChannelRatio * 100)} percent of the gate span`}
      >
        <rect x="24" y="117" width="592" height="120" fill="#f7e8db" rx="8" />
        <text x="320" y="222" textAnchor="middle" fill="#825f4c" fontSize="14">
          p-type silicon body
        </text>
        <rect x="55" y="125" width="57" height="75" fill="#8fc0ee" rx="4" />
        <rect x="526" y="125" width="59" height="75" fill="#8fc0ee" rx="4" />
        <text x="83" y="152" textAnchor="middle" fill="#163b63" fontSize="13" fontWeight="700">
          n⁺
        </text>
        <text x="555" y="152" textAnchor="middle" fill="#163b63" fontSize="13" fontWeight="700">
          n⁺
        </text>
        <text x="83" y="115" textAnchor="middle" fontSize="13">
          Source
        </text>
        <text x="555" y="115" textAnchor="middle" fontSize="13">
          Drain
        </text>
        <rect x="112" y="89" width="414" height="23" fill="#c7dce2" />
        <text x="320" y="106" textAnchor="middle" fill="#375563" fontSize="12">
          gate oxide
        </text>
        <rect x="112" y="41" width="414" height="39" fill="#6d7888" rx="4" />
        <text x="320" y="65" textAnchor="middle" fill="white" fontSize="15" fontWeight="700">
          Gate · VGS = {fmt(gateVoltage, 2)} V
        </text>
        {on && <path d={path} fill="#2d83d4" opacity="0.72" />}
        {state.region === 'saturation' && (
          <>
            <rect
              x={channelEnd}
              y="136"
              width={Math.max(0, drainEdge - channelEnd)}
              height="56"
              fill="#f3bd72"
              opacity="0.5"
            />
            <line
              x1={channelEnd}
              x2={channelEnd}
              y1="126"
              y2="191"
              stroke="#c56c22"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            <text
              x={Math.min(channelEnd + 8, 532)}
              y="126"
              fill="#a95018"
              fontSize="12"
              fontWeight="700"
            >
              pinch-off
            </text>
          </>
        )}
        {on &&
          Array.from({ length: 9 }, (_, index) => {
            const progress = (index / 9 + phase) % 1;
            const x = sourceEdge + 9 + progress * (drainEdge - sourceEdge - 18);
            const inChannel = x <= channelEnd;
            const fraction = Math.min(1, (x - sourceEdge) / Math.max(1, channelEnd - sourceEdge));
            const localThickness = thickness + (drainThickness - thickness) * fraction;
            const y = inChannel ? channelStartY + Math.max(2, localThickness * 0.46) : 151;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4.1"
                fill="#073e85"
                stroke="white"
                strokeWidth="1.2"
              />
            );
          })}
        <text x="320" y="249" textAnchor="middle" fill="#425969" fontSize="12">
          electrons: source → channel → drain
        </text>
      </svg>
    </div>
  );
}

function MosfetOutputDemo({ modulation }: { modulation: boolean }) {
  const { v, set, reset } = useParams({ VGS: 2.2, VDS: modulation ? 3.2 : 0.6, lambda: 0.12 });
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
  }, []);
  const lambda = modulation ? v.lambda : 0;
  const selected = mosfetOutput(v.VGS, v.VDS, threshold, beta, lambda);
  const curve = Array.from({ length: 151 }, (_, i) => {
    const voltage = (i * maxDrainVoltage) / 150;
    return [voltage, mosfetOutput(v.VGS, voltage, threshold, beta, lambda).drainCurrent] as [
      number,
      number,
    ];
  });
  const idealCurve = Array.from({ length: 151 }, (_, i) => {
    const voltage = (i * maxDrainVoltage) / 150;
    return [voltage, mosfetOutput(v.VGS, voltage, threshold, beta, 0).drainCurrent] as [
      number,
      number,
    ];
  });
  const highCurrent = mosfetOutput(v.VGS, maxDrainVoltage, threshold, beta, lambda).drainCurrent;
  const status =
    selected.region === 'off'
      ? 'Below threshold: no strong inversion channel forms.'
      : selected.region === 'linear'
        ? 'Linear region: inversion charge tapers toward the drain as VDS rises.'
        : modulation
          ? 'After pinch-off, the depleted drain end advances toward the source. The shorter effective channel raises ID.'
          : 'Pinch-off: extra VDS falls across the drain-side depleted region. Electrons still cross it; ideal ID levels off.';
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setPlaying(true);
          }}
          items={[
            {
              key: 'VGS',
              label: 'Gate-to-source voltage VGS',
              min: 0,
              max: 3.6,
              step: 0.05,
              unit: 'V',
            },
            {
              key: 'VDS',
              label: 'Drain-to-source voltage VDS',
              min: 0,
              max: maxDrainVoltage,
              step: 0.05,
              unit: 'V',
            },
            ...(modulation
              ? [
                  {
                    key: 'lambda',
                    label: 'Channel-length modulation λ',
                    min: 0,
                    max: 0.3,
                    step: 0.01,
                    unit: 'V⁻¹',
                  },
                ]
              : []),
          ]}
        >
          <div className="chips" role="group" aria-label="Animation controls">
            <button
              type="button"
              className={playing ? 'active' : undefined}
              onClick={() => setPlaying((old) => !old)}
            >
              {playing ? 'Pause electrons' : 'Play electrons'}
            </button>
            <button
              type="button"
              onClick={() => set('VDS', Math.max(0, selected.saturationVoltage - 0.35))}
            >
              Before pinch-off
            </button>
            <button
              type="button"
              onClick={() =>
                set('VDS', Math.min(maxDrainVoltage, selected.saturationVoltage + 1.2))
              }
            >
              Beyond pinch-off
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title={modulation ? 'Channel-length modulation model' : 'Long-channel pinch-off model'}
          forms={
            modulation
              ? [
                  {
                    label: 'Ideal saturation onset',
                    formula: String.raw`V_{DS,sat}\simeq V_{GS}-V_T`,
                  },
                  {
                    label: 'Post-pinch-off current',
                    formula: String.raw`I_D\simeq\frac{\beta}{2}(V_{GS}-V_T)^2[1+\lambda(V_{DS}-V_{DS,sat})]`,
                  },
                ]
              : [
                  {
                    label: 'Drain-end inversion charge',
                    formula: String.raw`Q'_n(L)\simeq-C'_{ox}(V_{GS}-V_T-V_{DS})`,
                  },
                  {
                    label: 'Pinch-off condition',
                    formula: String.raw`V_{DS,sat}\simeq V_{GS}-V_T`,
                  },
                  {
                    label: 'Ideal current in saturation',
                    formula: String.raw`I_{D,sat}\simeq\frac{\beta}{2}(V_{GS}-V_T)^2`,
                  },
                ]
          }
          substitution={String.raw`V_{DS,sat}=${fmt(selected.saturationVoltage, 2)}\,\mathrm{V},\quad I_D=${fmt(selected.drainCurrent, 3)}\,\mathrm{mA}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        {modulation
          ? 'Increase drain voltage beyond pinch-off and watch the drain-side depletion region grow. Compare the real-model curve with the ideal flat saturation line.'
          : 'Raise drain voltage through VGS − VT. Watch the electron channel narrow at the drain while carriers keep crossing into the drain.'}
      </p>
      <p className="capacitance-dominance" role="status">
        {status}
      </p>
      <Metrics>
        <Metric label="Gate overdrive VGS − VT" value={fmt(selected.overdrive, 2)} unit="V" />
        <Metric label="Pinch-off voltage" value={fmt(selected.saturationVoltage, 2)} unit="V" />
        <Metric label="Drain current ID" value={fmt(selected.drainCurrent, 3)} unit="mA" />
        {modulation && (
          <Metric
            label="Effective channel length"
            value={fmt(selected.effectiveLengthRatio * 100, 1)}
            unit="% of L"
          />
        )}
      </Metrics>
      <ChannelScene gateVoltage={v.VGS} drainVoltage={v.VDS} lambda={lambda} playing={playing} />
      <Plot
        title="Drain current versus drain voltage"
        xLabel="VDS (V)"
        yLabel="ID (mA)"
        xDomain={[0, maxDrainVoltage]}
        yDomain={[0, Math.max(0.4, highCurrent * 1.15)]}
        markers={[
          { x: selected.saturationVoltage, label: 'Pinch-off' },
          { x: v.VDS, label: 'Selected VDS' },
        ]}
        points={[
          {
            x: v.VDS,
            y: selected.drainCurrent,
            label: `${fmt(selected.drainCurrent, 2)} mA`,
            color: '#0b578e',
          },
        ]}
        series={[
          {
            name: modulation ? 'With channel-length modulation' : 'Ideal long-channel',
            color: '#176db5',
            points: curve,
          },
          ...(modulation
            ? [{ name: 'Ideal saturation', color: '#939eaa', dash: true, points: idealCurve }]
            : []),
        ]}
        onInspect={(voltage) =>
          `At VDS = ${fmt(voltage, 2)} V, ID = ${fmt(mosfetOutput(v.VGS, voltage, threshold, beta, lambda).drainCurrent, 3)} mA`
        }
      />
      <p className="carrier-motion-summary">
        Illustrative long-channel NMOS model with Vₜ = 0.8 V and β = 1 mA/V². The particle paths and
        depletion shape are schematic; λ controls the simple saturation slope.
      </p>
    </DemoLayout>
  );
}

export function PinchOffDemo() {
  return <MosfetOutputDemo modulation={false} />;
}
export function ChannelLengthModulationDemo() {
  return <MosfetOutputDemo modulation />;
}
