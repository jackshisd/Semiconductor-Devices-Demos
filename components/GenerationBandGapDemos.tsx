'use client';

import { useEffect, useState } from 'react';
import { Controls } from './Controls';
import { DemoLayout } from './Demos';

const generation = [
  {
    name: 'Band-to-band',
    detail:
      'Light or thermal energy lifts a valence electron into the conduction band, leaving a hole.',
  },
  {
    name: 'R–G center',
    detail: 'A defect level provides an intermediate step for trap-assisted generation.',
  },
  {
    name: 'Impact ionization',
    detail:
      'An energetic carrier collides with the lattice and creates an additional electron–hole pair.',
  },
];
const recombination = [
  { name: 'Direct', detail: 'An electron fills a hole directly and releases energy as a photon.' },
  {
    name: 'R–G center',
    detail:
      'A trap captures a carrier, then completes recombination through an intermediate level.',
  },
  {
    name: 'Auger',
    detail: 'Recombination transfers energy to a second carrier, which later loses it as heat.',
  },
];

function usePlayback() {
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(true);
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
      const now = performance.now();
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      if (!document.hidden) setPhase((old) => (old + dt / 2.8) % 1);
    }, 33);
    return () => window.clearInterval(timer);
  }, [running]);
  return { phase, setPhase, running, setRunning };
}

function ProcessDemo({ kind }: { kind: 'generation' | 'recombination' }) {
  const options = kind === 'generation' ? generation : recombination;
  const [selected, setSelected] = useState(0);
  const { phase, setPhase, running, setRunning } = usePlayback();
  const trap = selected === 1;
  const impactOrAuger = selected === 2;
  const trapProgress = phase < 0.4 ? phase / 0.8 : phase < 0.6 ? 0.5 : 0.5 + (phase - 0.6) / 0.8;
  const electronY =
    kind === 'generation'
      ? selected === 2
        ? 270 - 180 * Math.max(0, (phase - 0.45) / 0.55)
        : 270 - 180 * (trap ? trapProgress : phase)
      : 90 + 180 * (selected === 2 ? Math.min(1, phase * 1.6) : trap ? trapProgress : phase);
  const reset = () => {
    setSelected(0);
    setPhase(0);
  };
  return (
    <DemoLayout
      controls={
        <Controls values={{}} set={() => {}} reset={reset} items={[]}>
          <div className="chips" role="group" aria-label={`${kind} mechanism`}>
            {options.map((option, index) => (
              <button
                key={option.name}
                className={selected === index ? 'active' : ''}
                aria-pressed={selected === index}
                onClick={() => {
                  setSelected(index);
                  setPhase(0);
                }}
              >
                {option.name}
              </button>
            ))}
          </div>
          <div className="breakdown-playback">
            <button className="breakdown-action" onClick={() => setRunning((old) => !old)}>
              {running ? 'Pause' : 'Play'}
            </button>
            <button
              className="breakdown-action"
              onClick={() => {
                setRunning(false);
                setPhase((old) => Math.min(1, old + 0.2));
              }}
            >
              Step
            </button>
            <button className="breakdown-action" onClick={() => setPhase(0)}>
              Replay
            </button>
          </div>
        </Controls>
      }
    >
      <section className="plot-card teaching-scene carrier-process-scene">
        <div className="teaching-scene-head">
          <div>
            <span className="eyebrow">LECTURE 4 · SLIDE {kind === 'generation' ? '26' : '27'}</span>
            <h2>
              {kind === 'generation'
                ? 'Generation creates an electron–hole pair'
                : 'Recombination removes an electron–hole pair'}
            </h2>
          </div>
        </div>
        <div className="teaching-scene-scroll">
          <svg
            viewBox="0 0 820 360"
            role="img"
            aria-label={`${options[selected].name} ${kind}. ${options[selected].detail}`}
          >
            <rect x="40" y="44" width="740" height="270" rx="12" fill="#f7fafb" />
            <line x1="95" x2="725" y1="90" y2="90" stroke="#357896" strokeWidth="4" />
            <line x1="95" x2="725" y1="270" y2="270" stroke="#c37845" strokeWidth="4" />
            <text x="735" y="95" className="teaching-svg-title">
              Ec
            </text>
            <text x="735" y="275" className="teaching-svg-title">
              Ev
            </text>
            {trap && (
              <>
                <line
                  x1="255"
                  x2="565"
                  y1="180"
                  y2="180"
                  stroke="#8c6cad"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                />
                <text x="575" y="185" className="teaching-svg-small">
                  Trap level ET
                </text>
              </>
            )}
            {!impactOrAuger && (
              <>
                <line x1="405" x2="405" y1="104" y2="256" stroke="#8da6b0" strokeDasharray="5 5" />
                <circle cx="405" cy={electronY} r="12" fill="#237da5" />
                <text x="405" y={electronY + 5} textAnchor="middle" fill="white" fontSize="17">
                  −
                </text>
                <circle
                  cx="405"
                  cy="270"
                  r="16"
                  fill="none"
                  stroke="#d47845"
                  strokeWidth="3"
                  opacity={
                    kind === 'generation' ? Math.min(1, phase * 3) : Math.min(1, (1 - phase) * 10)
                  }
                />
              </>
            )}
            {impactOrAuger && kind === 'generation' && (
              <>
                <line
                  x1="165"
                  x2="385"
                  y1="112"
                  y2="112"
                  stroke="#237da5"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                <circle cx={165 + 220 * Math.min(phase * 2, 1)} cy="112" r="12" fill="#237da5" />
                <circle cx="425" cy={electronY} r="12" fill="#237da5" />
                <circle
                  cx="425"
                  cy="270"
                  r="16"
                  fill="none"
                  stroke="#d47845"
                  strokeWidth="3"
                  opacity={phase > 0.45 ? 1 : 0}
                />
                <text x="145" y="155" className="teaching-svg-small">
                  Energetic electron → collision
                </text>
              </>
            )}
            {impactOrAuger && kind === 'recombination' && (
              <>
                <circle cx="315" cy={electronY} r="12" fill="#237da5" />
                <circle
                  cx="315"
                  cy="270"
                  r="16"
                  fill="none"
                  stroke="#d47845"
                  strokeWidth="3"
                  opacity={Math.min(1, (1 - phase) * 10)}
                />
                <circle cx="535" cy={90 - 90 * Math.sin(Math.PI * phase)} r="12" fill="#237da5" />
                <text x="480" y="210" className="teaching-svg-small">
                  Energy → second electron → heat
                </text>
              </>
            )}
            {kind === 'generation' && !impactOrAuger && (
              <text x="105" y="203" className="teaching-svg-small">
                {trap ? 'Thermal activation through a defect' : 'Light or thermal energy supplied'}
              </text>
            )}
            {kind === 'recombination' && phase > 0.55 && (
              <text x="515" y="204" className="teaching-svg-title" fill="#7654ba">
                {selected === 0 ? '〰 photon' : selected === 1 ? '↝ heat' : '↝ heat'}
              </text>
            )}
            <text x="410" y="333" textAnchor="middle" className="teaching-svg-small">
              {options[selected].name} · step through the carrier transition
            </text>
          </svg>
        </div>
        <p className="teaching-caption">
          {options[selected].detail} Motion and timing are schematic; this diagram does not predict
          a physical rate.
        </p>
      </section>
    </DemoLayout>
  );
}

export function GenerationProcesses() {
  return <ProcessDemo kind="generation" />;
}

export function RecombinationProcesses() {
  return <ProcessDemo kind="recombination" />;
}

export function DirectIndirectBandGap() {
  const { phase, setPhase, running, setRunning } = usePlayback();
  const directElectronY = 163 + 100 * phase;
  const indirectX = 690 - 140 * Math.min(phase * 1.6, 1);
  const indirectY =
    phase < 0.625 ? 163 - 33 * (phase / 0.625) : 130 + 133 * ((phase - 0.625) / 0.375);
  return (
    <DemoLayout
      controls={
        <Controls values={{}} set={() => {}} reset={() => setPhase(0)} items={[]}>
          <div className="breakdown-playback">
            <button className="breakdown-action" onClick={() => setRunning((old) => !old)}>
              {running ? 'Pause' : 'Play'}
            </button>
            <button
              className="breakdown-action"
              onClick={() => {
                setRunning(false);
                setPhase((old) => Math.min(1, old + 0.2));
              }}
            >
              Step
            </button>
            <button className="breakdown-action" onClick={() => setPhase(0)}>
              Replay
            </button>
          </div>
        </Controls>
      }
    >
      <section className="plot-card teaching-scene carrier-process-scene">
        <div className="teaching-scene-head">
          <div>
            <span className="eyebrow">LECTURE 4 · SLIDE 28</span>
            <h2>Energy and crystal momentum both have to be conserved</h2>
          </div>
        </div>
        <div className="teaching-scene-scroll">
          <svg
            viewBox="0 0 920 390"
            role="img"
            aria-label="Direct gap: conduction minimum and valence maximum share momentum, so a vertical photon transition occurs. Indirect gap: the conduction minimum is shifted in momentum, requiring a phonon as well as a photon for recombination."
          >
            <rect x="25" y="30" width="420" height="330" rx="12" fill="#eef6fa" />
            <rect x="475" y="30" width="420" height="330" rx="12" fill="#f4f0fa" />
            <text x="235" y="65" textAnchor="middle" className="teaching-svg-title">
              Direct gap · GaAs, InP
            </text>
            <text x="685" y="65" textAnchor="middle" className="teaching-svg-title">
              Indirect gap · Si, Ge
            </text>
            <path d="M95 115 Q235 210 375 115" fill="none" stroke="#357896" strokeWidth="3" />
            <path d="M95 300 Q235 225 375 300" fill="none" stroke="#c37845" strokeWidth="3" />
            <path d="M525 115 Q690 210 855 115" fill="none" stroke="#357896" strokeWidth="3" />
            <path d="M500 300 Q550 225 600 300" fill="none" stroke="#c37845" strokeWidth="3" />
            <line x1="235" x2="235" y1="163" y2="263" stroke="#8da6b0" strokeDasharray="5 5" />
            <line x1="690" x2="550" y1="163" y2="130" stroke="#8c6cad" strokeDasharray="5 5" />
            <line x1="550" x2="550" y1="130" y2="263" stroke="#8da6b0" strokeDasharray="5 5" />
            <circle cx="235" cy={directElectronY} r="11" fill="#237da5" />
            <circle cx={indirectX} cy={indirectY} r="11" fill="#7654ba" />
            <circle
              cx="235"
              cy="263"
              r="13"
              fill="none"
              stroke="#d47845"
              strokeWidth="3"
              opacity={Math.min(1, (1 - phase) * 10)}
            />
            <circle
              cx="550"
              cy="263"
              r="13"
              fill="none"
              stroke="#d47845"
              strokeWidth="3"
              opacity={Math.max(0, 1 - Math.max(0, phase - 0.625) * 3)}
            />
            <text x="235" y="328" textAnchor="middle" className="teaching-svg-small">
              Same k → photon carries energy
            </text>
            <text x="685" y="328" textAnchor="middle" className="teaching-svg-small">
              Different k → phonon + photon
            </text>
            <text x="405" y="300" className="teaching-svg-small">
              k →
            </text>
            <text x="855" y="300" className="teaching-svg-small">
              k →
            </text>
            {phase > 0.3 && (
              <text x="303" y="230" className="teaching-svg-small">
                〰 photon
              </text>
            )}
            {phase > 0.1 && (
              <text x="710" y="118" className="teaching-svg-small">
                ↝ phonon (Δk)
              </text>
            )}
            {phase > 0.7 && (
              <text x="612" y="228" className="teaching-svg-small">
                〰 photon
              </text>
            )}
          </svg>
        </div>
        <p className="teaching-caption">
          A photon carries substantial energy but little crystal momentum. In an indirect gap
          material, a phonon supplies the momentum change. The paths show the conservation
          requirement schematically, not recombination rates.
        </p>
      </section>
    </DemoLayout>
  );
}
