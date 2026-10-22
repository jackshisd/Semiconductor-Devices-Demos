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
import { collisionTimes, flightAt, transportScales } from '../lib/lecture-three';
import { q } from '../lib/physics';

function usePlayback() {
  const [time, setTime] = useState(0),
    [running, setRunning] = useState(true);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const check = () => {
      if (media.matches) setRunning(false);
    };
    check();
    media.addEventListener('change', check);
    return () => media.removeEventListener('change', check);
  }, []);
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(),
        dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      if (!document.hidden) setTime((t) => t + dt);
    }, 33);
    return () => clearInterval(timer);
  }, [running]);
  return {
    time,
    reset: () => setTime(0),
    controls: (
      <div className="breakdown-playback">
        <button className="breakdown-action" onClick={() => setRunning((x) => !x)}>
          {running ? 'Pause' : 'Play'}
        </button>
        <button
          className="breakdown-action"
          onClick={() => {
            setRunning(false);
            setTime((t) => t + 0.1);
          }}
        >
          Step
        </button>
        <button className="breakdown-action" onClick={() => setTime(0)}>
          Restart animation
        </button>
      </div>
    ),
  };
}
function TypeChoice({ holes, setHoles }: { holes: boolean; setHoles: (value: boolean) => void }) {
  return (
    <div className="chips" role="group" aria-label="Carrier type">
      <button aria-pressed={!holes} onClick={() => setHoles(false)}>
        Electrons
      </button>
      <button aria-pressed={holes} onClick={() => setHoles(true)}>
        Holes
      </button>
    </div>
  );
}
const wrap = (x: number, width: number) => ((x % width) + width) % width;

export function ThermalDrift() {
  const { v, set, reset } = useParams({ T: 300, E: 100 });
  const [holes, setHoles] = useState(false);
  const playback = usePlayback();
  const m = transportScales(holes, v.T, v.E),
    sign = holes ? 1 : -1;
  const t = playback.time * Math.sqrt(v.T / 300);
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setHoles(false);
            playback.reset();
          }}
          items={[
            { key: 'T', label: 'Temperature', min: 200, max: 600, step: 10, unit: 'K' },
            { key: 'E', label: 'Electric field', min: -200, max: 200, step: 10, unit: 'V/cm' },
          ]}
        >
          <TypeChoice holes={holes} setHoles={setHoles} />
          {playback.controls}
        </Controls>
      }
      calculation={
        <Calculation
          formula={String.raw`v_{\rm th}=\sqrt{\frac{3k_BT}{m^*}},\qquad v_d=${holes ? '+' : '-'}\mu ${String.raw`\mathcal E`}`}
          substitution={String.raw`v_{\rm th}=${texSci(m.thermal)}\,\mathrm{cm/s},\quad v_d=${texSci(sign * m.lowField)}\,\mathrm{cm/s}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Random thermal motion continues even with no field. A field adds a much smaller average
        drift.
      </p>
      <Metrics>
        <Metric label="Thermal speed (RMS)" value={sci(m.thermal)} unit="cm/s" />
        <Metric label="Signed drift velocity" value={sci(sign * m.lowField)} unit="cm/s" />
        <Metric
          label="Drift / thermal speed"
          value={fmt((Math.abs(m.lowField) / m.thermal) * 100, 2)}
          unit="%"
        />
      </Metrics>
      <section className="plot-card transport-visual">
        <svg
          viewBox="0 0 600 390"
          role="img"
          aria-label="Two animated carrier populations compare random thermal motion without a field and thermal motion plus directed drift with a field."
        >
          {[0, 1].map((lane) => (
            <g key={lane}>
              <text x="20" y={25 + lane * 180} className="carrier-motion-title">
                {lane === 0
                  ? 'No field: motion, no average current'
                  : `Applied field ${v.E === 0 ? '= 0' : v.E > 0 ? '→' : '←'}: thermal motion + drift`}
              </text>
              <rect
                x="15"
                y={38 + lane * 180}
                width="570"
                height="135"
                rx="10"
                fill={lane ? '#fff6ee' : '#eff6fa'}
              />
              {Array.from({ length: 28 }, (_, i) => {
                const drift = lane ? ((sign * v.E) / 200) * playback.time * 38 : 0;
                const x =
                  25 +
                  wrap(
                    i * 83 +
                      25 * Math.sin(t * 2 + i * 1.7) +
                      19 * Math.sin(t * 3.3 + i * 0.8) +
                      drift,
                    550,
                  );
                const y = 55 + lane * 180 + wrap(i * 31 + 22 * Math.sin(t * 2.4 + i), 100);
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={y}
                      x2={x + 10 * Math.cos(t * 2 + i)}
                      y2={y + 10 * Math.sin(t * 2 + i)}
                      stroke={holes ? '#d47748' : '#247da5'}
                      opacity=".4"
                    />
                    <circle cx={x} cy={y} r="5" fill={holes ? '#d47748' : '#247da5'} />
                  </g>
                );
              })}
              {lane === 1 && v.E !== 0 && (
                <text x="300" y="375" textAnchor="middle" className="carrier-motion-title">
                  {holes ? 'Holes' : 'Electrons'} drift {sign * v.E > 0 ? '→' : '←'} · conventional
                  current {v.E > 0 ? '→' : '←'}
                </text>
              )}
            </g>
          ))}
        </svg>
        <p className="teaching-caption">
          Paths and drift are exaggerated and slowed for visibility. The readouts show the physical
          speed ratio. Carrier density is held fixed; this demo compares motion, not thermally
          generated carrier count. Mobilities use the slide's 300 K reference values.
        </p>
      </section>
    </DemoLayout>
  );
}

export function VelocitySaturation() {
  const { v, set, reset } = useParams({ E: 10000 });
  const playback = usePlayback();
  const n = transportScales(false, 300, v.E),
    p = transportScales(true, 300, v.E);
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            playback.reset();
          }}
          items={[
            {
              key: 'E',
              label: 'Electric field magnitude',
              min: 0,
              max: 100000,
              step: 100,
              unit: 'V/cm',
            },
          ]}
        >
          {playback.controls}
        </Controls>
      }
      calculation={
        <Calculation
          formula={String.raw`|v_d|\simeq\mu|\mathcal E|\ \text{at low field},\quad |v_d|\lesssim v_{\rm sat}`}
          substitution={String.raw`|v_n|=${texSci(n.capped)},\quad |v_p|=${texSci(p.capped)}\;\mathrm{cm/s}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Increase the field: the low-field line keeps rising, while the illustrated carrier speeds
        reach their saturation limits.
      </p>
      <Metrics>
        <Metric label="Electron speed" value={sci(n.capped)} unit="cm/s" />
        <Metric label="Hole speed" value={sci(p.capped)} unit="cm/s" />
      </Metrics>
      <section className="plot-card transport-visual">
        <svg
          viewBox="0 0 600 210"
          role="img"
          aria-label="Electron and hole lanes animate on a shared speed scale. Electrons move opposite the field; holes move along it."
        >
          <text x="300" y="22" textAnchor="middle" className="carrier-motion-title">
            Electric field →
          </text>
          {[n, p].map((model, i) => (
            <g key={i}>
              <text x="20" y={50 + i * 85} className="carrier-motion-title">
                {i ? 'Holes →' : '← Electrons'}
              </text>
              <rect
                x="20"
                y={60 + i * 85}
                width="560"
                height="35"
                rx="8"
                fill={i ? '#fff3e8' : '#edf5fb'}
              />
              {Array.from({ length: 7 }, (_, j) => (
                <circle
                  key={j}
                  cx={
                    30 +
                    wrap(j * 79 + (((i ? 1 : -1) * playback.time * model.capped) / 1e7) * 180, 540)
                  }
                  cy={78 + i * 85}
                  r="7"
                  fill={i ? '#d47748' : '#247da5'}
                />
              ))}
            </g>
          ))}
        </svg>
        <p className="teaching-caption">
          Both lanes use the same slowed speed scale. Silicon slide limits: electrons 8 × 10⁶ cm/s;
          holes 6 × 10⁶ cm/s.
        </p>
      </section>
      <Plot
        title="Drift speed versus electric field"
        xLabel="Electric field magnitude (V/cm)"
        yLabel="Speed magnitude (cm/s)"
        xDomain={[0, 100000]}
        yDomain={[0, 1.05e7]}
        height={350}
        series={[
          {
            name: 'Electrons: saturation illustration',
            color: '#247da5',
            points: pts(0, 100000, 250, (E) => transportScales(false, 300, E).capped),
          },
          {
            name: 'Holes: saturation illustration',
            color: '#d47748',
            points: pts(0, 100000, 250, (E) => transportScales(true, 300, E).capped),
          },
          {
            name: 'Electron low-field extrapolation',
            color: '#247da5',
            dash: true,
            points: pts(0, 100000, 250, (E) => 1400 * E),
          },
          {
            name: 'Hole low-field extrapolation',
            color: '#d47748',
            dash: true,
            points: pts(0, 100000, 250, (E) => 470 * E),
          },
        ]}
        markers={[{ x: v.E, label: 'Selected field' }]}
        points={[
          { x: v.E, y: n.capped, label: 'Electrons', color: '#247da5' },
          { x: v.E, y: p.capped, label: 'Holes', color: '#d47748' },
        ]}
      />
      <p className="teaching-caption">
        The solid curves use a simple cap on μE to illustrate the slide's two limits. The sharp
        corners are schematic; the slides do not give a full high-field transport law. Dashed
        extrapolations continue beyond the plotted speed range.
      </p>
    </DemoLayout>
  );
}

export function MomentumCollisions() {
  const { v, set, reset } = useParams({ E: 1000, tau: 0.1, T: 300 });
  const [holes, setHoles] = useState(true);
  const playback = usePlayback();
  const m = transportScales(holes, v.T, v.E, v.tau),
    flight = flightAt(playback.time % 8),
    sign = holes ? 1 : -1;
  const gained = q * v.E * 100 * flight.elapsed * m.tau;
  const times = collisionTimes.filter((t) => t <= 8);
  const momentum: [number, number][] = [[0, 0]];
  for (let i = 1; i < times.length; i++)
    momentum.push(
      [times[i] * v.tau, (q * v.E * 100 * (times[i] - times[i - 1]) * m.tau) / 1e-26],
      [times[i] * v.tau, 0],
    );
  const last = times[times.length - 1];
  momentum.push([8 * v.tau, (q * v.E * 100 * (8 - last) * m.tau) / 1e-26]);
  const ymax = Math.max(1, ...momentum.map((x) => x[1])) * 1.15;
  const length = flight.interval * m.meanFreePathNm;
  const distance = flight.elapsed * m.meanFreePathNm;
  const scale = Math.max(50, m.meanFreePathNm * 5);
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setHoles(true);
            playback.reset();
          }}
          items={[
            {
              key: 'E',
              label: 'Electric field magnitude',
              min: 0,
              max: 3000,
              step: 50,
              unit: 'V/cm',
            },
            {
              key: 'tau',
              label: 'Mean scattering time τ',
              min: 0.02,
              max: 0.3,
              step: 0.01,
              unit: 'ps',
            },
            { key: 'T', label: 'Temperature', min: 200, max: 600, step: 10, unit: 'K' },
          ]}
        >
          <TypeChoice
            holes={holes}
            setHoles={(value) => {
              setHoles(value);
              playback.reset();
            }}
          />
          {playback.controls}
        </Controls>
      }
      calculation={
        <Calculation
          forms={[
            {
              label: 'Drift from momentum balance',
              formula: String.raw`|v_d|=\frac{q|\mathcal E|\tau}{m^*},\quad\mu=\frac{q\tau}{m^*}`,
            },
            { label: 'Mean free path', formula: String.raw`\ell=v_{\rm th}\tau` },
          ]}
          substitution={String.raw`\mu=${fmt(m.mobility, 0)}\,\mathrm{cm^2/(V\,s)},\quad\ell=${fmt(m.meanFreePathNm, 1)}\,\mathrm{nm},\quad v_d=${texSci(sign * m.lowField)}\,\mathrm{cm/s}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Watch momentum build between collisions, then reset. Longer time between collisions means
        greater mobility and a longer mean free path.
      </p>
      <Metrics>
        <Metric label="Mean free path" value={fmt(m.meanFreePathNm, 1)} unit="nm" />
        <Metric label="Mobility" value={fmt(m.mobility, 0)} unit="cm²/(V·s)" />
        <Metric label="Time since collision" value={fmt(flight.elapsed * v.tau, 3)} unit="ps" />
      </Metrics>
      <section className="plot-card transport-visual">
        <svg
          viewBox="0 0 600 270"
          role="img"
          aria-label="A free-flight ruler shows distance since the last collision and momentum growing until the next collision."
        >
          <text x="25" y="26" className="carrier-motion-title">
            A sampled flight between collisions
          </text>
          <line x1="40" y1="95" x2="560" y2="95" stroke="#c3d4dc" strokeWidth="3" />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line x1={40 + i * 130} x2={40 + i * 130} y1="85" y2="105" stroke="#7c96a2" />
              <text x={40 + i * 130} y="125" textAnchor="middle" className="carrier-motion-note">
                {fmt((scale * i) / 4, 0)} nm
              </text>
            </g>
          ))}
          <line
            x1="40"
            x2={40 + Math.min(1, length / scale) * 520}
            y1="70"
            y2="70"
            stroke="#d47748"
            strokeDasharray="5 4"
          />
          <circle
            cx={40 + Math.min(1, distance / scale) * 520}
            cy="95"
            r="11"
            fill={holes ? '#d47748' : '#247da5'}
          />
          {flight.elapsed < 0.15 && (
            <circle
              cx="40"
              cy="95"
              r={15 + (1 - flight.elapsed / 0.15) * 15}
              fill="none"
              stroke="#d47748"
            />
          )}
          <text x="25" y="163" className="carrier-motion-title">
            Field-gained momentum: {sci(gained)} kg·m/s
          </text>
          <rect x="25" y="180" width="550" height="20" rx="6" fill="#edf3f5" />
          <rect
            x="25"
            y="180"
            width={(550 * flight.elapsed) / flight.interval}
            height="20"
            rx="6"
            fill={holes ? '#d47748' : '#247da5'}
          />
          <text x="25" y="229" className="carrier-motion-note">
            Collision → new flight · carrier drift {v.E === 0 ? '= 0' : holes ? '→' : '←'}
          </text>
          <text x="25" y="251" className="carrier-motion-note">
            Dashed segment: this flight's sampled length {fmt(length, 1)} nm
          </text>
        </svg>
        <p className="teaching-caption">
          Flight lengths use thermal speed × sampled free-flight time; this is path length, not
          directed drift displacement. The momentum bar shows progress through the current flight;
          the numeric value is in physical units. Flights are sampled from an exponential
          waiting-time distribution and slowed for viewing.
        </p>
      </section>
      <Plot
        title="Field-gained momentum between collisions"
        xLabel="Time (ps)"
        yLabel="Momentum magnitude (10⁻²⁶ kg·m/s)"
        xDomain={[0, 8 * v.tau]}
        yDomain={[0, ymax]}
        height={300}
        series={[
          { name: 'Momentum gained since last collision', color: '#247da5', points: momentum },
        ]}
        markers={flight.time <= 8 ? [{ x: flight.time * v.tau, label: 'Now' }] : []}
      />
      <p className="teaching-caption">
        Scattering randomizes momentum: the diagram resets the field-gained component, not the
        carrier's thermal motion. The chart shows the first eight mean-scattering-time units of the
        repeating sample. Masses are 0.26 m₀ for electrons and 0.39 m₀ for holes.
      </p>
    </DemoLayout>
  );
}
