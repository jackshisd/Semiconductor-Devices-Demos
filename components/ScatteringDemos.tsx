'use client';
import { useEffect, useRef, useState } from 'react';
import { Controls, Toggle } from './Controls';
import { DemoLayout, Calculation, useParams } from './Demos';
import { advanceCarriers, ions, makeCarriers, type ScatteringKind } from '../lib/scattering';

export function PhononScattering() {
  return <Scattering kind="phonon" />;
}
export function ImpurityScattering() {
  return <Scattering kind="impurity" />;
}
function Scattering({ kind }: { kind: ScatteringKind }) {
  const { v, set, reset } = useParams({ temperature: 300, doping: 16, speed: 1 });
  const [running, setRunning] = useState(true),
    [field, setField] = useState(0),
    [charge, setCharge] = useState(1);
  const [scene, setScene] = useState({ carriers: makeCarriers(), time: 0 });
  const latest = useRef({
    kind,
    temperature: v.temperature,
    density: 10 ** v.doping,
    field,
    charge,
    speed: v.speed,
  });
  useEffect(() => {
    latest.current = {
      kind,
      temperature: v.temperature,
      density: 10 ** v.doping,
      field,
      charge,
      speed: v.speed,
    };
  }, [kind, v.temperature, v.doping, field, charge, v.speed]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (media.matches) setRunning(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const step = (dt: number) =>
    setScene((old) => ({
      carriers: advanceCarriers(old.carriers, dt * latest.current.speed, latest.current),
      time: old.time + dt * latest.current.speed,
    }));
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) step(dt);
    }, 33);
    return () => clearInterval(timer);
  }, [running]);
  const phonon = kind === 'phonon';
  const ionCount = Math.max(2, Math.min(32, Math.round(2 + (v.doping - 14) * 7.5)));
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setField(0);
            setCharge(1);
            setScene({ carriers: makeCarriers(), time: 0 });
          }}
          items={[
            { key: 'temperature', label: 'Temperature', min: 200, max: 600, step: 10, unit: 'K' },
            ...(!phonon
              ? [
                  {
                    key: 'doping',
                    label: 'log₁₀(ND + NA)',
                    min: 14,
                    max: 18,
                    step: 0.25,
                    unit: 'cm⁻³',
                  },
                ]
              : []),
            { key: 'speed', label: 'Animation speed', min: 0.25, max: 2, step: 0.25, unit: '×' },
          ]}
        >
          <div className="chips" role="group" aria-label="Applied electric field">
            <button aria-pressed={field === 0} onClick={() => setField(0)}>
              No field
            </button>
            <button aria-pressed={field === 1} onClick={() => setField(1)}>
              Field →
            </button>
            <button aria-pressed={field === -1} onClick={() => setField(-1)}>
              Field ←
            </button>
          </div>
          {!phonon && (
            <Toggle
              label={`Ion type: ${charge === 1 ? 'donor ions +' : 'acceptor ions −'}`}
              checked={charge === -1}
              onChange={(acceptors) => setCharge(acceptors ? -1 : 1)}
            />
          )}
          <div className="breakdown-playback">
            <button className="breakdown-action" onClick={() => setRunning((x) => !x)}>
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
            <button
              className="breakdown-action"
              onClick={() => setScene({ carriers: makeCarriers(), time: 0 })}
            >
              Restart paths
            </button>
          </div>
        </Controls>
      }
    >
      <p className="carrier-motion-summary">
        {phonon
          ? 'Warm the crystal: atoms vibrate more, and electron paths change direction more often.'
          : 'Watch electron paths bend around fixed charged ions. Add ions, raise temperature, or reverse the ion charge.'}
      </p>
      <section className="plot-card scattering-scene">
        <header className="scattering-caption">
          <strong>{phonon ? 'Vibrating silicon lattice' : 'Charged dopants in the lattice'}</strong>
          <span>
            {v.temperature} K
            {!phonon ? ` · ND + NA = ${(10 ** v.doping).toExponential(2)} cm⁻³` : ''}
          </span>
        </header>
        <svg
          viewBox="0 0 600 320"
          role="img"
          aria-label={
            phonon
              ? 'Animated electrons scatter from a vibrating lattice. Orange flashes mark scattering events.'
              : 'Animated blue electron trajectories curve toward positive donor ions or away from negative acceptor ions.'
          }
        >
          <rect width="600" height="320" rx="10" fill="#f2f7fa" />
          {Array.from({ length: 77 }, (_, i) => {
            const x = 30 + (i % 11) * 54,
              y = 25 + Math.floor(i / 11) * 45;
            const amplitude = phonon ? 2 + (v.temperature - 200) / 55 : 0;
            const dx = Math.sin(scene.time * 9 + i * 2.4) * amplitude,
              dy = Math.cos(scene.time * 11 + i * 1.7) * amplitude;
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3" fill="#d7e0e4" />
                {phonon && (
                  <>
                    <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke="#a6b9c3" />
                    <circle cx={x + dx} cy={y + dy} r="6" fill="#b6c8d2" />
                  </>
                )}
              </g>
            );
          })}
          {!phonon &&
            ions.slice(0, ionCount).map((ion, i) => (
              <g key={i}>
                <circle
                  cx={ion.x}
                  cy={ion.y}
                  r="22"
                  fill={charge === 1 ? '#ebbd7d22' : '#967bc522'}
                  stroke={charge === 1 ? '#c8924c66' : '#9473b666'}
                  strokeDasharray="3 5"
                />
                <circle cx={ion.x} cy={ion.y} r="9" fill={charge === 1 ? '#c8924c' : '#9473b6'} />
                <text x={ion.x} y={ion.y + 4} textAnchor="middle" fill="white" fontSize="14">
                  {charge === 1 ? '+' : '−'}
                </text>
              </g>
            ))}
          {scene.carriers.map((p, i) => (
            <g key={i}>
              <polyline
                points={p.trail.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="#559fbe"
                strokeWidth="1.2"
                opacity="0.5"
              />
              {p.flash > 0 && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={7 + p.flash * 8}
                  fill="none"
                  stroke="#d78043"
                  opacity={p.flash}
                />
              )}
              <circle cx={p.x} cy={p.y} r="3.5" fill="#247da5" stroke="white" strokeWidth="1" />
            </g>
          ))}
        </svg>
        <p className="teaching-caption">
          Blue dots are electrons; trails show recent motion.{' '}
          {phonon
            ? 'Orange pulses mark a change in momentum. Lattice motion illustrates phonons; the collision model samples thermal scattering rather than hard-sphere impacts.'
            : 'The ions stay fixed. Positive ions attract electrons; negative ions repel them. Faster electrons bend less as they pass an ion.'}{' '}
          {field === 0
            ? 'Without a field, random thermal motion produces no average current.'
            : `Electrons acquire a drift ${field === 1 ? 'left' : 'right'}, opposite the field.`}
        </p>
      </section>
      <section className="scattering-takeaway">
        <h2>
          {phonon
            ? 'More vibration → more scattering → lower mobility'
            : 'More ions → more deflection → lower mobility'}
        </h2>
        <Calculation
          formula={
            phonon
              ? String.raw`\mu_{\mathrm{phonon}}\propto T^{-3/2}`
              : String.raw`\mu_{\mathrm{impurity}}\propto\frac{T^{3/2}}{N_D+N_A}`
          }
          substitution={
            String.raw`T=${v.temperature}\,\mathrm{K}` +
            (!phonon ? String.raw`,\quad N_D+N_A=10^{${v.doping}}\,\mathrm{cm^{-3}}` : '')
          }
        />
        <p>
          {phonon
            ? 'Increase temperature to shorten the straight portions of the electron paths.'
            : 'Increase temperature to make electrons travel faster and turn less. Increase total ionized doping to add scattering centers.'}
        </p>
        <p className="teaching-caption">
          Qualitative, slowed-down illustration. Drawing distances, ion counts and collision rates
          are schematic; they are not calibrated mobility measurements. Each demo isolates one
          scattering mechanism.
        </p>
      </section>
    </DemoLayout>
  );
}
