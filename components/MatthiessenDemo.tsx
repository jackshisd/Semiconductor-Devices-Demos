'use client';
import { useEffect, useRef, useState } from 'react';
import { Controls, Toggle } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, pts, sci, useParams } from './Demos';
import Plot, { type Series } from './Plot';
import { advanceMatthiessen, makeMatthiessenScene, matthiessen } from '../lib/matthiessen';

export default function MatthiessenDemo() {
  const { v, set, reset } = useParams({ T: 300, N: 1e16 });
  const [phonons, setPhonons] = useState(true),
    [impurities, setImpurities] = useState(true),
    [log, setLog] = useState(true),
    [running, setRunning] = useState(true);
  const [scene, setScene] = useState(makeMatthiessenScene);
  const model = matthiessen(v.T, v.N, phonons, impurities);
  const latest = useRef({ model, T: v.T });
  useEffect(() => {
    latest.current = { model, T: v.T };
  }, [v.T, v.N, phonons, impurities]);
  const step = (dt: number) =>
    setScene((old) => advanceMatthiessen(old, dt, latest.current.model, latest.current.T));
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
        dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) step(dt);
    }, 33);
    return () => clearInterval(timer);
  }, [running]);
  const transform = (x: number) => (log ? Math.log10(x) : x);
  const samples = pts(200, 600, 160, (T) => T).map(([T]) => ({
    T,
    m: matthiessen(T, v.N, phonons, impurities),
  }));
  const series: Series[] = [
    ...(phonons
      ? [
          {
            name: 'Phonon limit',
            color: '#247da5',
            dash: true,
            points: samples.map(({ T, m }) => [T, transform(m.phonon)] as [number, number]),
          },
        ]
      : []),
    ...(impurities
      ? [
          {
            name: 'Impurity limit',
            color: '#d47748',
            dash: true,
            points: samples.map(({ T, m }) => [T, transform(m.impurity)] as [number, number]),
          },
        ]
      : []),
    ...(model.total !== null
      ? [
          {
            name: 'Combined mobility',
            color: '#248474',
            points: samples.map(({ T, m }) => [T, transform(m.total!)] as [number, number]),
          },
        ]
      : []),
  ];
  const values = series.flatMap((s) => s.points.map((p) => p[1]));
  const lower = values.length ? Math.min(...values) : 0,
    upper = values.length ? Math.max(...values) : 1;
  const domain: [number, number] = log
    ? [Math.floor(lower - 0.15), Math.ceil(upper + 0.15)]
    : [0, Math.max(1, upper * 1.08)];
  const noScattering = model.total === null;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setPhonons(true);
            setImpurities(true);
            setLog(true);
            setScene(makeMatthiessenScene());
          }}
          items={[
            { key: 'T', label: 'Temperature', min: 200, max: 600, step: 10, unit: 'K' },
            {
              key: 'N',
              label: 'Total ionized dopants ND + NA',
              min: 1e14,
              max: 1e18,
              step: 1e14,
              unit: 'cm⁻³',
              log: true,
            },
          ]}
        >
          <Toggle label="Include phonon scattering" checked={phonons} onChange={setPhonons} />
          <Toggle
            label="Include impurity scattering"
            checked={impurities}
            onChange={setImpurities}
          />
          <Toggle label="Log mobility axis" checked={log} onChange={setLog} />
          <div className="breakdown-playback">
            <button className="breakdown-action" onClick={() => setRunning((s) => !s)}>
              {running ? 'Pause' : 'Play'}
            </button>
            <button
              className="breakdown-action"
              onClick={() => {
                setRunning(false);
                step(0.05);
              }}
            >
              Step
            </button>
            <button className="breakdown-action" onClick={() => setScene(makeMatthiessenScene())}>
              Restart paths
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          forms={[
            {
              label: 'Independent scattering rates add',
              formula: String.raw`\frac1\tau=\frac1{\tau_{\rm ph}}+\frac1{\tau_{\rm imp}}`,
            },
            {
              label: 'Inverse mobilities add',
              formula: String.raw`\frac1\mu=\frac1{\mu_{\rm ph}}+\frac1{\mu_{\rm imp}},\qquad\mu=\frac{q\tau}{m^*}`,
            },
          ]}
          substitution={
            noScattering
              ? String.raw`\frac1\mu=0\quad\text{(no finite scattering-limited mobility)}`
              : String.raw`\frac1\mu=${phonons ? String.raw`\frac1{${fmt(model.phonon, 1)}}` : '0'}+${impurities ? String.raw`\frac1{${fmt(model.impurity, 1)}}` : '0'},\quad\mu=${fmt(model.total!, 1)}\;\mathrm{cm^2/(V\,s)}`
          }
        />
      }
    >
      <p className="carrier-motion-summary">
        A carrier can scatter from either mechanism. Their rates add, so the combined mobility is
        below either individual limit when both are active.
      </p>
      <Metrics>
        <Metric label="Phonon-only limit" value={fmt(model.phonon, 0)} unit="cm²/(V·s)" />
        <Metric label="Impurity-only limit" value={fmt(model.impurity, 0)} unit="cm²/(V·s)" />
        <Metric
          label="Combined mobility"
          value={noScattering ? 'No finite limit' : fmt(model.total!, 0)}
          unit={noScattering ? 'both mechanisms off' : 'cm²/(V·s)'}
        />
      </Metrics>
      <section className="plot-card transport-visual matthiessen-scene">
        <svg
          viewBox="0 0 600 340"
          role="img"
          aria-label="Three animated lanes compare phonon-only scattering, impurity-only scattering, and the selected combination. Blue rings mark phonon collisions and orange rings mark impurity collisions."
        >
          <text x="300" y="22" textAnchor="middle" className="carrier-motion-title">
            Same weak field → · electrons drift ←
          </text>
          {scene.lanes.map((lane, i) => (
            <g key={i}>
              <text x="20" y={48 + i * 98} className="carrier-motion-title">
                {i === 0 ? 'Phonons only' : i === 1 ? 'Impurities only' : 'Selected combination'}
                {i === 2
                  ? ` · ${phonons ? 'phonons' : ''}${phonons && impurities ? ' + ' : ''}${impurities ? 'impurities' : ''}${noScattering ? 'no scattering' : ''}`
                  : ''}
              </text>
              <rect
                x="20"
                y={56 + i * 98}
                width="560"
                height="72"
                rx="8"
                fill={i === 0 ? '#eef6fb' : i === 1 ? '#fff5ec' : '#eff8f5'}
              />
              {lane.map((p, j) => (
                <g key={j} transform={`translate(20 ${56 + i * 98})`}>
                  <polyline
                    points={p.trail.map(([x, y]) => `${x},${y}`).join(' ')}
                    stroke="#6f99ad"
                    strokeWidth="1.2"
                    opacity=".6"
                    fill="none"
                  />
                  {p.flash > 0 && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={7 + 8 * p.flash}
                      fill="none"
                      stroke={p.cause === 'phonon' ? '#247da5' : '#d47748'}
                      strokeWidth="2"
                      opacity={p.flash}
                    />
                  )}
                  <circle cx={p.x} cy={p.y} r="4.5" fill="#315f74" />
                </g>
              ))}
            </g>
          ))}
        </svg>
        <p className="teaching-caption">
          The first two lanes are reference cases; toggles affect the third lane and combined curve.
          Blue rings = phonon events; orange rings = impurity events. All dots represent identical
          electrons. Playback is slowed, collision rates are capped for clarity, and trajectories
          are schematic.
        </p>
      </section>
      <section className="matthiessen-budget" aria-label="Scattering rate contributions">
        <h2>Share of the total scattering rate</h2>
        <div
          className="matthiessen-rate-bar"
          role="img"
          aria-label={`Phonons ${fmt(model.phononShare * 100, 0)} percent, impurities ${fmt(model.impurityShare * 100, 0)} percent`}
        >
          <span style={{ width: `${model.phononShare * 100}%`, background: '#247da5' }} />
          <span style={{ width: `${model.impurityShare * 100}%`, background: '#d47748' }} />
        </div>
        <p>
          {noScattering
            ? 'Both mechanisms are off: there is no finite scattering-limited mobility in this model.'
            : `Phonons ${fmt(model.phononShare * 100, 0)}% · impurities ${fmt(model.impurityShare * 100, 0)}%. ${model.phononShare > 0.5 ? 'Phonons dominate.' : model.impurityShare > 0.5 ? 'Impurities dominate.' : 'Equal scattering rates halve either individual mobility.'}`}
        </p>
      </section>
      <Plot
        title="Mobility versus temperature"
        xLabel="Temperature (K)"
        yLabel={log ? 'log₁₀ mobility (cm²/(V·s))' : 'Mobility (cm²/(V·s))'}
        xDomain={[200, 600]}
        yDomain={domain}
        height={360}
        series={series}
        markers={[{ x: v.T, label: 'Selected temperature' }]}
        points={
          model.total === null
            ? []
            : [
                {
                  x: v.T,
                  y: transform(model.total),
                  label: `μ = ${fmt(model.total, 0)} cm²/(V·s)`,
                  color: '#248474',
                },
              ]
        }
        onInspect={(T) => {
          const m = matthiessen(T, v.N, phonons, impurities);
          return m.total === null
            ? 'No scattering: no finite mobility limit'
            : `${fmt(T, 0)} K · combined μ = ${fmt(m.total, 1)} cm²/(V·s)`;
        }}
      />
      <p className="teaching-caption">
        Illustrative electron mobility limits: μph = 1400(T/300)⁻³ᐟ² and μimp =
        1400(T/300)³ᐟ²(10¹⁶/(ND + NA)), in cm²/(V·s). The slides provide these temperature/doping
        scalings, not their proportionality constants. These reference values demonstrate the rule
        rather than fit measured silicon data; screening is omitted. Current ionized doping:{' '}
        {sci(v.N)} cm⁻³.
      </p>
    </DemoLayout>
  );
}
