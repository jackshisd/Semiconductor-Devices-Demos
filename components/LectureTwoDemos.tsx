'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Controls, Toggle } from './Controls';
import Plot from './Plot';
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
import {
  atomicBands,
  equilibriumDoping,
  boltzmannComparison,
  makeSand,
  advanceSand,
  disturbSand,
} from '../lib/lecture-models';
import * as P from '../lib/physics';

function useClock(running: boolean, onFrame: (dt: number) => void) {
  const frame = useRef(onFrame);
  useEffect(() => {
    frame.current = onFrame;
  }, [onFrame]);
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.06, (now - last) / 1000);
      last = now;
      if (!document.hidden) frame.current(dt);
    }, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [running]);
}

export function BandFormation() {
  const [atoms, setAtoms] = useState(1);
  const [running, setRunning] = useState(false);
  const model = useMemo(() => atomicBands(atoms), [atoms]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setAtoms((old) => Math.min(96, old + 1));
    }, 110);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (atoms === 96) setRunning(false);
  }, [atoms]);
  const reset = () => {
    setAtoms(1);
    setRunning(false);
  };
  const Y = (energy: number) => 405 - ((energy + 1.4) / 4) * 330;
  const dos = [...model.valenceDOS, ...model.conductionDOS];
  const maxDOS = Math.max(
    ...[...atomicBands(96).valenceDOS, ...atomicBands(96).conductionDOS].map((bin) => bin.density),
    1,
  );
  return (
    <DemoLayout
      controls={
        <Controls
          values={{ atoms }}
          set={(_key, value) => {
            setAtoms(Math.round(value));
            setRunning(false);
          }}
          reset={reset}
          items={[
            {
              key: 'atoms',
              label: 'Atoms in the cluster',
              min: 1,
              max: 96,
              step: 1,
              unit: 'atoms',
            },
          ]}
        ></Controls>
      }
    >
      <Metrics>
        <Metric label="Atoms" value={String(atoms)} />
        <Metric label="Valence states" value={String(model.valenceStates)} unit="including spin" />
        <Metric
          label="Conduction states"
          value={String(model.conductionStates)}
          unit="including spin"
        />
        <Metric label="Silicon band gap" value="1.12" unit="eV" />
      </Metrics>
      <section className="plot-card teaching-scene">
        <div className="teaching-scene-head">
          <div>
            <span className="eyebrow">ISOLATED LEVELS → DENSE BANDS</span>
            <h2>
              {atoms === 1
                ? 'Silicon states: start with one atom'
                : 'Each added atom adds new allowed states'}
            </h2>
          </div>
          <div className="breakdown-playback">
            <button
              className="breakdown-action primary"
              onClick={() => {
                if (atoms === 96) setAtoms(1);
                setRunning((old) => !old);
              }}
            >
              {running ? 'Pause growth' : atoms === 96 ? 'Replay growth' : 'Grow crystal'}
            </button>
            <button
              className="breakdown-action"
              disabled={atoms === 96}
              onClick={() => {
                setRunning(false);
                setAtoms((old) => Math.min(96, old + 1));
              }}
            >
              Add atom
            </button>
          </div>
        </div>
        <div className="teaching-scene-scroll">
          <svg
            viewBox="0 0 900 465"
            role="img"
            aria-label={`${atoms} atoms create ${2 * atoms} valence energy levels and ${2 * atoms} conduction energy levels; each level has two spin states.`}
          >
            <text x="28" y="36" className="teaching-svg-title">
              Atom cluster
            </text>
            <text x="330" y="36" className="teaching-svg-title">
              Allowed electron energies
            </text>
            <text x="686" y="36" className="teaching-svg-title">
              Density of states
            </text>
            {Array.from({ length: atoms }, (_, i) => (
              <g key={i} className="new-atom">
                <circle
                  cx={40 + (i % 8) * 27}
                  cy={100 + Math.floor(i / 8) * 23}
                  r="7"
                  fill="#237d87"
                />
                <circle
                  cx={38 + (i % 8) * 27}
                  cy={98 + Math.floor(i / 8) * 23}
                  r="2"
                  fill="#b9e1de"
                />
              </g>
            ))}
            <text x="28" y="420" className="teaching-svg-small">
              4N states in each band
            </text>
            <text x="28" y="440" className="teaching-svg-small">
              Schematic level spacing
            </text>
            <rect x="320" y={Y(1.12)} width="285" height={Y(0) - Y(1.12)} fill="#f1f4f5" />
            {[-1.2, 0, 1.12, 2.32].map((E) => (
              <g key={E}>
                <line
                  x1="305"
                  x2="865"
                  y1={Y(E)}
                  y2={Y(E)}
                  stroke="#cbd8dd"
                  strokeDasharray="3 4"
                />
                <text x="298" y={Y(E) + 4} textAnchor="end" className="teaching-svg-small">
                  {fmt(E, 2)}
                </text>
              </g>
            ))}
            <text x="280" y="65" className="teaching-svg-small">
              E (eV)
            </text>
            <text x="460" y={Y(0.64)} textAnchor="middle" className="teaching-svg-small">
              No states in the bandgap
            </text>
            {model.valence.map((E, i) => (
              <g
                key={`v-${i}`}
                className="energy-level"
                style={{ transform: `translateY(${Y(E)}px)` }}
              >
                <line
                  x1="335"
                  x2="590"
                  y1="0"
                  y2="0"
                  stroke="#d56138"
                  strokeWidth={atoms > 35 ? 1 : 2}
                />
              </g>
            ))}
            {model.conduction.map((E, i) => (
              <g
                key={`c-${i}`}
                className="energy-level"
                style={{ transform: `translateY(${Y(E)}px)` }}
              >
                <line
                  x1="335"
                  x2="590"
                  y1="0"
                  y2="0"
                  stroke="#176fa9"
                  strokeWidth={atoms > 35 ? 1 : 2}
                />
              </g>
            ))}
            <text x="460" y="65" textAnchor="middle" className="teaching-svg-small">
              Conduction {atoms === 1 ? 'precursor' : 'band'} · empty
            </text>
            <text x="460" y="440" textAnchor="middle" className="teaching-svg-small">
              Valence {atoms === 1 ? 'precursor' : 'band'} · filled
            </text>
            {dos.map((bin, i) => (
              <rect
                key={i}
                x="690"
                y={Y(bin.energy + 0.015)}
                width={(bin.density / maxDOS) * 170}
                height={(330 / 4) * 0.03}
                fill={bin.energy < 0 ? '#d56138' : '#176fa9'}
                opacity=".8"
              />
            ))}
            <line x1="690" x2="860" y1="413" y2="413" stroke="#78919a" />
            {[0, 0.5, 1].map((f) => (
              <text
                key={f}
                x={690 + 170 * f}
                y="432"
                textAnchor="middle"
                className="teaching-svg-small"
              >
                {fmt(maxDOS * f, 0)}
              </text>
            ))}
            <text x="775" y="453" textAnchor="middle" className="teaching-svg-small">
              States / eV · whole cluster
            </text>
          </svg>
        </div>
        <p className="teaching-caption">
          An isolated Si atom has two 3s states and six 3p states. In the crystal these form 4N
          valence states and 4N conduction states. Drawn level positions illustrate band formation;
          the histogram counts states per eV on a fixed scale.
        </p>
      </section>
    </DemoLayout>
  );
}

export function DopingCarriers() {
  const { v, set, reset } = useParams({ N: 1e16 });
  const [type, setType] = useState<'n' | 'p'>('n');
  const [log, setLog] = useState(true);
  const state = equilibriumDoping(type, v.N);
  const donor = type === 'n';
  const Ei = P.intrinsicMidgapOffset(300),
    Ec = 0.56,
    Ev = -0.56;
  const Ef = Ei + P.thermalVoltage(300) * Math.log(state.n / state.intrinsic);
  const transform = (value: number) => (log ? Math.log10(value) : value);
  const curves = (carrier: 'n' | 'p') =>
    pts(12, 17, 160, (x) => x).map(
      ([x]) =>
        [log ? x : 10 ** x, transform(equilibriumDoping(type, 10 ** x)[carrier])] as [
          number,
          number,
        ],
    );
  const selectedX = log ? Math.log10(v.N) : v.N;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setType('n');
            setLog(true);
          }}
          items={[
            {
              key: 'N',
              label: donor ? 'Donor density ND' : 'Acceptor density NA',
              min: 1e12,
              max: 1e17,
              step: 1e12,
              unit: 'cm⁻³',
              log: true,
            },
          ]}
        >
          <div className="doping-type-choice" role="group" aria-label="Dopant type">
            <button type="button" aria-pressed={donor} onClick={() => setType('n')}>
              N-type · As donor
            </button>
            <button type="button" aria-pressed={!donor} onClick={() => setType('p')}>
              P-type · B acceptor
            </button>
          </div>
          <Toggle label="Log concentration axes" checked={log} onChange={setLog} />
        </Controls>
      }
      calculation={
        <Calculation
          title="Charge neutrality and equilibrium"
          forms={[
            { label: 'Charge neutrality', formula: String.raw`n-p=N_D-N_A` },
            { label: 'Mass action', formula: String.raw`np=n_i^2` },
            { label: 'Fermi-level position', formula: String.raw`E_F-E_i=kT\ln(n/n_i)` },
          ]}
          substitution={String.raw`n=${texSci(state.n)},\quad p=${texSci(state.p)}\;\mathrm{cm^{-3}},\quad E_F-E_i=${fmt(Ef - Ei, 3)}\;\mathrm{eV}`}
        />
      }
    >
      <div className="doping-demo">
        <div className={`doping-summary ${donor ? 'is-donor' : 'is-acceptor'}`}>
          <strong>{donor ? 'N-type silicon' : 'P-type silicon'}</strong>
          <span>{donor ? 'Arsenic donors' : 'Boron acceptors'} · 300 K</span>
          <p>
            {donor
              ? 'Donors supply mobile electrons and leave fixed positive ions.'
              : 'Acceptors take a bonding electron, leaving a mobile hole and a fixed negative ion.'}
          </p>
        </div>
        <Metrics>
          <Metric
            label={`Electrons n · ${donor ? 'majority' : 'minority'}`}
            value={sci(state.n)}
            unit="cm⁻³"
          />
          <Metric
            label={`Holes p · ${donor ? 'minority' : 'majority'}`}
            value={sci(state.p)}
            unit="cm⁻³"
          />
        </Metrics>
        <Plot
          title="Fermi level vs doping"
          xDomain={log ? [12, 17] : [1e12, 1e17]}
          yDomain={[-0.65, 0.65]}
          xLabel={log ? 'log₁₀ dopant density (cm⁻³)' : 'Dopant density (cm⁻³)'}
          yLabel="Energy from midgap (eV)"
          series={[
            {
              name: 'EF',
              color: '#17815c',
              points: pts(12, 17, 160, (x) => x).map(
                ([x]) =>
                  [
                    log ? x : 10 ** x,
                    Ei +
                      P.thermalVoltage(300) *
                        Math.log(equilibriumDoping(type, 10 ** x).n / state.intrinsic),
                  ] as [number, number],
              ),
            },
            {
              name: 'Ec',
              color: '#247da5',
              points: [
                [log ? 12 : 1e12, Ec],
                [log ? 17 : 1e17, Ec],
              ],
            },
            {
              name: 'Ev',
              color: '#d47748',
              points: [
                [log ? 12 : 1e12, Ev],
                [log ? 17 : 1e17, Ev],
              ],
            },
            {
              name: 'Ei',
              color: '#94a0a8',
              dash: true,
              points: [
                [log ? 12 : 1e12, Ei],
                [log ? 17 : 1e17, Ei],
              ],
            },
          ]}
          markers={[{ x: selectedX, label: 'Selected doping' }]}
          points={[
            {
              x: selectedX,
              y: Ef,
              label: 'EF = ' + fmt(Ef - Ei, 3) + ' eV from Ei',
              color: '#17815c',
            },
          ]}
        />
        <Plot
          title="Carrier concentrations vs doping"
          xDomain={log ? [12, 17] : [1e12, 1e17]}
          yDomain={log ? [2, 18] : [0, 1.05e17]}
          xLabel={log ? 'log₁₀ dopant density (cm⁻³)' : 'Dopant density (cm⁻³)'}
          yLabel={log ? 'log₁₀ carriers (cm⁻³)' : 'Carriers (cm⁻³)'}
          series={[
            { name: 'Electrons n', color: '#247da5', points: curves('n') },
            { name: 'Holes p', color: '#d47748', points: curves('p') },
            {
              name: 'Intrinsic ni',
              color: '#94a0a8',
              dash: true,
              points: [
                [log ? 12 : 1e12, transform(state.intrinsic)],
                [log ? 17 : 1e17, transform(state.intrinsic)],
              ],
            },
          ]}
          markers={[{ x: selectedX, label: 'Selected doping' }]}
          points={[
            { x: selectedX, y: transform(state.n), label: 'n', color: '#247da5' },
            { x: selectedX, y: transform(state.p), label: 'p', color: '#d47748' },
          ]}
          onInspect={(x) => {
            const r = equilibriumDoping(type, log ? 10 ** x : x);
            return `n = ${sci(r.n)} · p = ${sci(r.p)} cm⁻³`;
          }}
        />
      </div>
    </DemoLayout>
  );
}

export function ThermalEquilibrium() {
  const { v, set, reset } = useParams({ vibration: 3 });
  const [scene, setScene] = useState(() => makeSand());
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setRunning(false);
  }, []);
  useClock(running, (dt) => setScene((old) => advanceSand(old, v.vibration * 100, dt)));
  const high = scene.grains.filter((grain) => grain.y >= 0.18).length / scene.grains.length;
  const Y = (y: number) => 350 - y * 260;
  const counts = Array.from(
    { length: 10 },
    (_, i) =>
      scene.grains.filter((grain) => grain.y >= i / 10 && (grain.y < (i + 1) / 10 || i === 9))
        .length,
  );
  const vibration = running ? (Math.sin(scene.time * 35) * v.vibration * 100) / 150 : 0;
  const disturb = () => setScene((old) => disturbSand(old));
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setScene(makeSand());
            setRunning(true);
          }}
          items={[
            {
              key: 'vibration',
              label: 'Vibration strength',
              min: 1,
              max: 6,
              step: 0.1,
              unit: 'relative',
            },
          ]}
        />
      }
    >
      <Metrics>
        <Metric label="Grains above the marked height" value={fmt(high * 100, 0)} unit="% now" />

        <Metric label="Upward / downward crossings" value={`${scene.up} / ${scene.down}`} />
        <Metric label="Grains" value="100" unit="conserved" />
      </Metrics>
      <section className="plot-card teaching-scene">
        <div className="teaching-scene-head">
          <div>
            <span className="eyebrow">LECTURE 2 · VIBRATING-TABLE ANALOGY</span>
            <h2>Equilibrium keeps moving</h2>
          </div>
          <div className="breakdown-playback">
            <button className="breakdown-action" onClick={() => setRunning((old) => !old)}>
              {running ? 'Pause' : 'Play'}
            </button>
            <button
              className="breakdown-action"
              onClick={() => {
                setRunning(false);
                setScene((old) => advanceSand(old, v.vibration * 100, 0.12));
              }}
            >
              Step
            </button>
            <button className="breakdown-action primary" onClick={disturb}>
              Disturb sand
            </button>
          </div>
        </div>
        <div className="teaching-scene-scroll">
          <svg
            viewBox="0 0 900 430"
            role="button"
            tabIndex={0}
            aria-label="Disturb the sand on the vibrating table. Higher particles represent higher energy."
            onClick={disturb}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                disturb();
              }
            }}
          >
            <text x="40" y="38" className="teaching-svg-title">
              Thermal agitation
            </text>
            <text x="650" y="38" className="teaching-svg-title">
              Height distribution
            </text>
            <text x="40" y="66" className="teaching-svg-small">
              Tap the dish to disturb the grains, then watch them settle
            </text>
            <path
              d="M65 120 V330 Q65 355 90 355 H545 Q570 355 570 330 V120"
              fill="#fbfcfc"
              stroke="#64878b"
              strokeWidth="4"
            />
            <line
              x1="65"
              x2="570"
              y1={Y(0.18)}
              y2={Y(0.18)}
              stroke="#d09238"
              strokeDasharray="6 5"
            />
            <text x="75" y={Y(0.18) - 9} className="teaching-svg-small">
              Higher-energy threshold
            </text>
            {scene.grains.map((grain) => (
              <circle
                key={grain.id}
                cx={75 + grain.x * 485}
                cy={Y(grain.y)}
                r="4.2"
                fill={grain.y >= 0.18 ? '#d09238' : '#366b7c'}
                stroke="white"
                strokeWidth=".6"
              />
            ))}
            <g transform={`translate(0 ${vibration})`}>
              <rect x="35" y="360" width="565" height="28" rx="5" fill="#c7e4ec" stroke="#698f9c" />
              <text x="315" y="379" textAnchor="middle" className="teaching-svg-small">
                Vibrating table · thermal reservoir
              </text>
            </g>
            {counts.map((count, i) => (
              <g key={i}>
                <rect
                  x="680"
                  y={Y((i + 1) / 10) + 5}
                  width={count * 1.7}
                  height="14"
                  fill="#367a8a"
                />
                <text
                  x="670"
                  y={Y((i + 1) / 10) + 17}
                  textAnchor="end"
                  className="teaching-svg-small"
                >
                  {fmt((i + 0.5) / 10, 2)}
                </text>
              </g>
            ))}
            <text x="655" y="72" className="teaching-svg-small">
              Height ↗ energy
            </text>
            <text x="680" y="380" className="teaching-svg-small">
              Current grain counts · schematic heights
            </text>
            <text x="40" y="418" className="teaching-svg-small">
              Higher vibration → more grains reach high energy. Upward and downward traffic balance
              on average.
            </text>
          </svg>
        </div>
        <p className="teaching-caption">
          Based on the sand-in-a-dish analogy on Lecture 2 slide 29. The moving grains illustrate
          energy exchange and balanced reverse processes. Vibration strength and animation timing
          are qualitative.
        </p>
      </section>
    </DemoLayout>
  );
}

export function BoltzmannApproximation() {
  const { v, set, reset } = useParams({ T: 300, E: 0.1 });
  const [holes, setHoles] = useState(false);
  const [log, setLog] = useState(false);
  const current = boltzmannComparison(v.E, v.T, holes);
  const xs = pts(-0.3, 0.3, 240, (x) => x);
  const curve = (approximate: boolean) =>
    xs.map(([E]) => {
      const s = boltzmannComparison(E, v.T, holes);
      const value = approximate ? s.approximate : s.exact;
      return [E, log ? Math.log10(Math.max(value, 1e-30)) : value] as [number, number];
    });
  const threshold = 3 * P.thermalVoltage(v.T) * (holes ? -1 : 1);
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setHoles(false);
            setLog(false);
          }}
          items={[
            { key: 'T', label: 'Temperature', min: 200, max: 600, step: 1, unit: 'K' },
            {
              key: 'E',
              label: 'Probe energy E − EF',
              min: -0.3,
              max: 0.3,
              step: 0.001,
              unit: 'eV',
            },
          ]}
        >
          <Toggle label="Hole probability 1 − f" checked={holes} onChange={setHoles} />
          <Toggle label="Log probability axis" checked={log} onChange={setLog} />
        </Controls>
      }
      calculation={
        <Calculation
          formula={
            holes
              ? String.raw`1-f(E)=\frac{1}{1+e^{-(E-E_F)/k_BT}}\approx e^{(E-E_F)/k_BT}`
              : String.raw`f(E)=\frac{1}{1+e^{(E-E_F)/k_BT}}\approx e^{-(E-E_F)/k_BT}`
          }
          substitution={String.raw`(E-E_F)/k_BT=${fmt(v.E / P.thermalVoltage(v.T), 2)},\quad P_{\mathrm{FD}}=${fmt(current.exact, 5)},\quad P_{\mathrm B}=${fmt(current.approximate, 5)}`}
        />
      }
    >
      <Metrics>
        <Metric label="Exact probability" value={fmt(current.exact * 100, 3)} unit="%" />
        <Metric
          label="Boltzmann estimate"
          value={current.approximate <= 1 ? fmt(current.approximate * 100, 3) : '> 100'}
          unit="%"
        />
        <Metric label="Energy separation" value={fmt(current.x, 2)} unit="kT" />
        <Metric label="3kT criterion" value={current.valid ? 'Satisfied' : 'Outside tail'} />
      </Metrics>
      <Plot
        title={
          holes
            ? 'When can 1 − f be approximated by an exponential?'
            : 'When can f be approximated by an exponential?'
        }
        xLabel="Energy E − EF (eV)"
        yLabel={log ? 'log₁₀ probability' : 'Occupation probability'}
        xDomain={[-0.3, 0.3]}
        yDomain={log ? [-6, 0.05] : [0, 1.05]}
        series={[
          { name: 'Exact Fermi–Dirac', color: '#176fa9', points: curve(false) },
          { name: 'Boltzmann approximation', color: '#d56138', dash: true, points: curve(true) },
        ]}
        zones={[{ from: holes ? -0.3 : threshold, to: holes ? threshold : 0.3, color: '#14875f' }]}
        markers={[
          { x: threshold, label: holes ? '3kT below EF' : '3kT above EF' },
          { x: v.E, label: 'Selected energy' },
        ]}
        points={[
          {
            x: v.E,
            y: log ? Math.log10(current.exact) : current.exact,
            label: `Exact: ${fmt(current.exact, 4)}`,
            color: '#176fa9',
          },
        ]}
        height={320}
        onInspect={(E) => {
          const s = boltzmannComparison(E, v.T, holes);
          return `${fmt(E, 3)} eV · exact ${fmt(s.exact, 4)} · Boltzmann ${fmt(s.approximate, 4)}`;
        }}
      />
      <p className="teaching-caption">
        The green region meets the lecture’s 3kT rule: relative error is about 5% or less. Outside
        the tail, the exponential can exceed 1 and no longer represents a valid occupation
        probability; those values extend above the graph’s probability axis.
      </p>
    </DemoLayout>
  );
}
