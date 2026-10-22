'use client';
import { useEffect, useRef, useState } from 'react';
import { Controls } from './Controls';
import { DemoLayout, useParams } from './Demos';
import { advanceCarrierMotion, carrierSites as sites } from '../lib/carrier-motion';

export function ElectronHoleMotion() {
  const { v, set, reset } = useParams({ speed: 1 });
  const [direction, setDirection] = useState<1 | -1>(1),
    [running, setRunning] = useState(true);
  const [scene, setScene] = useState({ hole: 2, phase: 0, electron: 0 });
  const latest = useRef({ direction, speed: v.speed });
  useEffect(() => {
    latest.current = { direction, speed: v.speed };
  }, [direction, v.speed]);
  const advance = (dt: number) =>
    setScene((old) => {
      const { direction: s, speed } = latest.current;
      return advanceCarrierMotion(old, dt * speed, s);
    });
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (media.matches) setRunning(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(),
        dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!document.hidden) advance(dt);
    }, 33);
    return () => window.clearInterval(timer);
  }, [running]);
  const flip = (s: 1 | -1) => {
    setDirection(s);
    setScene({ hole: s === 1 ? 2 : 5, phase: 0, electron: 0 });
  };
  const X = (index: number) => 70 + index * 65;
  const next = scene.hole + direction,
    nextValid = next >= 0 && next < sites;
  const electronSite = direction === 1 ? sites - 1 - scene.electron : scene.electron;
  const electronNext = electronSite - direction;
  const freeX =
    X(electronSite) +
    (electronNext >= 0 && electronNext < sites ? -direction * scene.phase * 65 : 0);
  const holeX = X(scene.hole) + (nextValid ? direction * scene.phase * 65 : 0);
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            flip(1);
            setRunning(true);
          }}
          items={[
            { key: 'speed', label: 'Animation speed', min: 0.25, max: 2, step: 0.25, unit: '×' },
          ]}
        >
          <div className="chips" role="group" aria-label="Electric field direction">
            <button
              aria-pressed={direction === 1}
              className={direction === 1 ? 'active' : ''}
              onClick={() => flip(1)}
            >
              Field →
            </button>
            <button
              aria-pressed={direction === -1}
              className={direction === -1 ? 'active' : ''}
              onClick={() => flip(-1)}
            >
              Field ←
            </button>
          </div>
          <div className="breakdown-playback">
            <button className="breakdown-action" onClick={() => setRunning((s) => !s)}>
              {running ? 'Pause' : 'Play'}
            </button>
            <button
              className="breakdown-action"
              onClick={() => {
                setRunning(false);
                setScene((old) => advanceCarrierMotion({ ...old, phase: 0 }, 1, direction));
              }}
            >
              One hop
            </button>
          </div>
        </Controls>
      }
    >
      <p className="carrier-motion-summary">
        {direction === 1
          ? 'Electrons drift left; holes drift right.'
          : 'Electrons drift right; holes drift left.'}{' '}
        Both give conventional current along the electric field.
      </p>
      <section className="plot-card carrier-motion-scene">
        <div className="carrier-motion-scroll">
          <svg
            viewBox="0 0 600 430"
            role="img"
            aria-label={`Electric field points ${direction === 1 ? 'right' : 'left'}. A conduction electron drifts ${direction === 1 ? 'left' : 'right'}. Bond electrons hop into a vacancy, moving the hole ${direction === 1 ? 'right' : 'left'}.`}
          >
            <defs>
              <marker
                id={`motion-arrow-${direction}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0 10 5 0 10Z" fill="#288271" />
              </marker>
            </defs>
            <text x="300" y="26" textAnchor="middle" className="carrier-motion-title">
              Electric field {direction === 1 ? '→' : '←'}
            </text>
            <line
              x1={direction === 1 ? 215 : 385}
              x2={direction === 1 ? 385 : 215}
              y1="43"
              y2="43"
              stroke="#288271"
              strokeWidth="3"
              markerEnd={`url(#motion-arrow-${direction})`}
            />
            <text x="25" y="83" className="carrier-motion-title">
              1. Conduction electron
            </text>
            <rect x="37" y="99" width="523" height="75" rx="9" fill="#edf5fb" />
            {Array.from({ length: 8 }, (_, i) => (
              <circle key={i} cx={X(i)} cy="136" r="10" fill="#dbe5ea" />
            ))}
            <circle cx={freeX} cy="136" r="13" fill="#247da5" />
            <text x={freeX} y="141" textAnchor="middle" fontSize="20" fill="white">
              −
            </text>
            <text x="300" y="194" textAnchor="middle" className="carrier-motion-note">
              The mobile negative charge moves {direction === 1 ? '← opposite' : '→ opposite'} the
              field.
            </text>
            <text x="25" y="236" className="carrier-motion-title">
              2. Hole in the valence band
            </text>
            <rect x="37" y="253" width="523" height="82" rx="9" fill="#fff6ef" />
            {Array.from({ length: sites }, (_, i) => (
              <g key={i}>
                <circle cx={X(i)} cy="294" r="16" fill="white" stroke="#d4dfe1" strokeWidth="1.5" />
                {i !== scene.hole && (!nextValid || i !== next) && (
                  <circle cx={X(i)} cy="294" r="7" fill="#247da5" />
                )}
              </g>
            ))}
            {nextValid && (
              <circle
                cx={X(next) + (X(scene.hole) - X(next)) * scene.phase}
                cy="294"
                r="7"
                fill="#247da5"
              />
            )}
            <circle cx={holeX} cy="294" r="18" fill="none" stroke="#d47748" strokeWidth="3" />
            <text x="300" y="357" textAnchor="middle" className="carrier-motion-note">
              A bond electron hops {direction === 1 ? '←' : '→'}; the vacancy (hole) moves{' '}
              {direction === 1 ? '→' : '←'}.
            </text>
            <text x="300" y="389" textAnchor="middle" className="carrier-motion-title">
              Conventional current {direction === 1 ? '→' : '←'} in both cases
            </text>
            <text x="300" y="416" textAnchor="middle" className="carrier-motion-note">
              Blue = electron · orange ring = missing bond electron
            </text>
          </svg>
        </div>
        <p className="teaching-caption">
          A hole is a moving absence of an electron, not a new particle hopping between bonds. At a
          contact, the illustration starts a new carrier. Motion is slowed down and schematic.
        </p>
      </section>
    </DemoLayout>
  );
}
