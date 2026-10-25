'use client';

import { useMemo, useState } from 'react';
import { Controls, Toggle } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, sci, texSci, useParams } from './Demos';
import * as P from '../lib/physics';

const blue = '#2672d9';
const orange = '#d56138';
const purple = '#7654ba';
const W = 1120,
  H = 390,
  top = 45,
  bottom = 326;
const energySpan = 0.55;
const offsets = Array.from({ length: 161 }, (_, index) => (energySpan * index) / 160);
const referenceEc = P.bandgap(300) / 2 - P.intrinsicMidgapOffset(300);
const minEnergy = referenceEc - P.bandgap(300) - energySpan;
const maxEnergy = referenceEc + energySpan;

type Point = [number, number];
const path = (points: Point[]) =>
  points.map(([x, y], index) => (index ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)).join(' ');
const axisMaximum = (value: number) => {
  const power = 10 ** Math.floor(Math.log10(value));
  return power * ([1, 2, 5, 10].find((step) => step * power >= value) ?? 10);
};

export function HoleDistributionDemo() {
  const { v, set, reset } = useParams({ dopant: 1e16, T: 300 });
  const [type, setType] = useState<'n' | 'p'>('n');
  const [logSpectrum, setLogSpectrum] = useState(false);
  const [hoverEnergy, setHoverEnergy] = useState<number | null>(null);
  const base = useMemo(() => P.dopedFermi(type, v.dopant, v.T), [type, v.dopant, v.T]);
  const Ef = base.Ef,
    Ec = base.Ec,
    Ev = base.Ev;
  const Vt = P.thermalVoltage(v.T);
  const degenerate = type === 'n' ? Ef >= Ec : Ef <= Ev;
  const nearBandEdge = type === 'n' ? Ec - Ef < 3 * Vt : Ef - Ev < 3 * Vt;
  const edgeState = P.carrierDensitiesFromFermi(type === 'n' ? Ec : Ev, v.T);
  const edgeThreshold = type === 'n' ? edgeState.n - edgeState.p : edgeState.p - edgeState.n;
  const Y = (energy: number) =>
    top + ((maxEnergy - energy) / (maxEnergy - minEnergy)) * (bottom - top);
  const energyAtY = (y: number) =>
    maxEnergy - ((y - top) / (bottom - top)) * (maxEnergy - minEnergy);
  const conductionY = Y(Ec),
    valenceY = Y(Ev);
  const holes = offsets.map((offset) => P.carrierSpectrum('p', offset, Ef, v.T));
  const electrons = offsets.map((offset) => P.carrierSpectrum('n', offset, Ef, v.T));
  const maxValenceStates = holes[holes.length - 1].states;
  const maxConductionStates = electrons[electrons.length - 1].states;
  const dosMaximum = axisMaximum(Math.max(maxValenceStates, maxConductionStates));
  const { spectrumMaximum, logMinimum, logMaximum } = useMemo(() => {
    let largestPeak = 0;
    let smallestPeak = Infinity;
    for (const T of [200, 300, 450]) {
      const referenceEf = P.dopedFermi(type, v.dopant, T).Ef;
      for (const carrier of ['n', 'p'] as const) {
        const peak = Math.max(
          ...offsets.map(
            (offset) => P.carrierSpectrum(carrier, offset, referenceEf, T).occupiedStates,
          ),
        );
        largestPeak = Math.max(largestPeak, peak);
        smallestPeak = Math.min(smallestPeak, peak);
      }
    }
    return {
      spectrumMaximum: axisMaximum(largestPeak * 1.05),
      logMinimum: Math.floor(Math.log10(smallestPeak)) - 3,
      logMaximum: Math.ceil(Math.log10(largestPeak * 1.05)),
    };
  }, [type, v.dopant]);
  const spectrumX = (value: number) =>
    815 +
    194 *
      (logSpectrum
        ? Math.max(
            0,
            (Math.log10(Math.max(value, 10 ** logMinimum)) - logMinimum) /
              (logMaximum - logMinimum),
          )
        : value / spectrumMaximum);
  const peakIndex = holes.reduce(
    (best, point, index) => (point.occupiedStates > holes[best].occupiedStates ? index : best),
    0,
  );
  const electronPeakIndex = electrons.reduce(
    (best, point, index) => (point.occupiedStates > electrons[best].occupiedStates ? index : best),
    0,
  );
  const fermiY = Y(Ef);
  const fermiLabelY =
    Math.abs(fermiY - conductionY) < 18
      ? fermiY + 18
      : Math.abs(fermiY - valenceY) < 18
        ? fermiY - 22
        : fermiY - 9;
  const holeCurve: Point[] = offsets.map((offset, index) => [
    spectrumX(holes[index].occupiedStates),
    Y(Ev - offset),
  ]);
  const electronCurve: Point[] = offsets.map((offset, index) => [
    spectrumX(electrons[index].occupiedStates),
    Y(Ec + offset),
  ]);
  const holeArea = path([[815, valenceY], ...holeCurve, [815, bottom]]);
  const electronArea = path([[815, conductionY], ...electronCurve, [815, top]]);
  const holeAtHover =
    hoverEnergy !== null && hoverEnergy <= Ev
      ? P.carrierSpectrum('p', Ev - hoverEnergy, Ef, v.T)
      : null;
  const electronAtHover =
    hoverEnergy !== null && hoverEnergy >= Ec
      ? P.carrierSpectrum('n', hoverEnergy - Ec, Ef, v.T)
      : null;
  const inspect = holeAtHover
    ? 'E ' +
      fmt(hoverEnergy!, 3) +
      ' eV · gᵥ ' +
      sci(holeAtHover.states) +
      ' · 1−f ' +
      fmt(holeAtHover.occupation, 4) +
      ' · p(E) ' +
      sci(holeAtHover.occupiedStates) +
      ' cm⁻³/eV'
    : electronAtHover
      ? 'E ' +
        fmt(hoverEnergy!, 3) +
        ' eV · g꜀ ' +
        sci(electronAtHover.states) +
        ' · f ' +
        fmt(electronAtHover.occupation, 4) +
        ' · n(E) ' +
        sci(electronAtHover.occupiedStates) +
        ' cm⁻³/eV'
      : hoverEnergy === null
        ? 'Hover over the figure to inspect an energy'
        : 'No allowed band states in the gap';
  return (
    <DemoLayout
      calculation={
        <Calculation
          formula={
            '\\begin{aligned}n&=\\int_{E_C}^{\\infty}g_C(E)f(E)\\,dE\\\\p&=\\int_{-\\infty}^{E_V}g_V(E)[1-f(E)]\\,dE\\end{aligned}'
          }
          substitution={String.raw`n=${texSci(base.n0)}\,\mathrm{cm^{-3}},\quad p=${texSci(base.p0)}\,\mathrm{cm^{-3}}`}
        />
      }
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setType('n');
            setLogSpectrum(false);
          }}
          items={[
            {
              key: 'dopant',
              label: type === 'n' ? 'Donor concentration Nᴅ' : 'Acceptor concentration Nₐ',
              min: 1e14,
              max: 1e20,
              step: 1e13,
              unit: 'cm⁻³',
              log: true,
            },
            { key: 'T', label: 'Temperature', min: 200, max: 450, step: 1, unit: 'K' },
          ]}
        >
          <div className="chips" role="group" aria-label="Doping type">
            <button className={type === 'n' ? 'active' : ''} onClick={() => setType('n')}>
              N-type donors
            </button>
            <button className={type === 'p' ? 'active' : ''} onClick={() => setType('p')}>
              P-type acceptors
            </button>
          </div>
          <Toggle
            label="Log carrier-distribution axis"
            checked={logSpectrum}
            onChange={setLogSpectrum}
          />
        </Controls>
      }
    >
      <Metrics>
        <Metric label="Electrons n" value={sci(base.n0)} unit="cm⁻³" />
        <Metric label="Holes p" value={sci(base.p0)} unit="cm⁻³" />
        <Metric label="Fermi level Eꜰ" value={fmt(Ef, 3)} unit="eV from Eᵢ" />
        <Metric
          label={type === 'n' ? 'Eᴄ − Eꜰ' : 'Eꜰ − Eᴠ'}
          value={fmt(type === 'n' ? Ec - Ef : Ef - Ev, 3)}
          unit="eV"
        />
        <Metric label="Band-edge doping" value={sci(edgeThreshold)} unit="cm⁻³" />
        <Metric
          label="Statistics"
          value={degenerate ? 'Degenerate' : nearBandEdge ? 'Near band edge' : 'Nondegenerate'}
          unit=""
        />
      </Metrics>
      {degenerate && (
        <div className="notice">
          Eꜰ has entered the {type === 'n' ? 'conduction' : 'valence'} band. The carrier totals use
          Fermi–Dirac statistics; a Boltzmann approximation is invalid here.
        </div>
      )}
      {!degenerate && nearBandEdge && (
        <div className="notice">
          Eꜰ is within 3kT of a band edge. The Boltzmann approximation is becoming inaccurate.
        </div>
      )}
      {v.dopant >= 3e18 && (
        <div className="notice">
          At very high doping, this ideal-band model omits bandgap narrowing and dopant-ionization
          effects.
        </div>
      )}
      <div className="plot-card spectrum-card">
        <div className="plot-title">
          <b>Electron and hole energy distributions</b>
          <span>Blue: electrons · Orange: holes</span>
        </div>
        <div className="spectrum-scroll">
          <svg
            viewBox={'0 0 ' + W + ' ' + H}
            role="img"
            aria-label="Energy bands, absolute density of states, occupation probabilities, and electron and hole distributions on one absolute carrier-density axis"
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const energy = energyAtY(((event.clientY - rect.top) * H) / rect.height);
              setHoverEnergy(Math.max(minEnergy, Math.min(maxEnergy, energy)));
            }}
            onMouseLeave={() => setHoverEnergy(null)}
          >
            <text x="48" y="24" className="spectrum-heading">
              Energy bands
            </text>
            <text x="295" y="24" className="spectrum-heading">
              Available states
            </text>
            <text x="510" y="25" className="spectrum-operator">
              ×
            </text>
            <text x="545" y="24" className="spectrum-heading">
              Occupation
            </text>
            <text x="781" y="25" className="spectrum-operator">
              =
            </text>
            <text x="807" y="24" className="spectrum-heading">
              Carrier distribution
            </text>
            {[250, 510, 780].map((x) => (
              <line key={x} x1={x} x2={x} y1="38" y2="338" stroke="#e5ecef" />
            ))}
            <line
              x1="43"
              x2="1054"
              y1={conductionY}
              y2={conductionY}
              stroke="#dce8f4"
              strokeDasharray="4 5"
            />
            <line
              x1="43"
              x2="1054"
              y1={valenceY}
              y2={valenceY}
              stroke="#f4e0d6"
              strokeDasharray="4 5"
            />
            <line
              x1="43"
              x2="1054"
              y1={fermiY}
              y2={fermiY}
              stroke={purple}
              strokeWidth="1.5"
              strokeDasharray="5 5"
              opacity=".75"
            />
            <line x1="53" x2="53" y1={top} y2={bottom} stroke="#a5b2ba" />
            <path d="M48 55 L53 45 L58 55" fill="none" stroke="#a5b2ba" />
            <text x="47" y="357" className="spectrum-axis">
              Energy E ↑
            </text>
            <text x="323" y={(conductionY + valenceY) / 2} className="spectrum-axis">
              Band gap {fmt(Ec - Ev, 3)} eV
            </text>
            <line
              x1="82"
              x2="207"
              y1={conductionY}
              y2={conductionY}
              stroke={blue}
              strokeWidth="3"
            />
            <line x1="82" x2="207" y1={valenceY} y2={valenceY} stroke={orange} strokeWidth="3" />
            <text x="88" y={conductionY - 9} fill={blue} className="spectrum-label">
              E꜀ {fmt(Ec, 3)} eV
            </text>
            <text x="88" y={valenceY + 22} fill={orange} className="spectrum-label">
              Eᵥ {fmt(Ev, 3)} eV
            </text>
            <text x="88" y={fermiLabelY} fill={purple} className="spectrum-label">
              Eꜰ {fmt(Ef, 3)} eV
            </text>
            <line x1="300" x2="300" y1={top} y2={bottom} stroke="#a5b2ba" />
            <path
              d={path(
                offsets.map((offset, index) => [
                  300 + (160 * electrons[index].states) / dosMaximum,
                  Y(Ec + offset),
                ]),
              )}
              fill="none"
              stroke={blue}
              strokeWidth="2.5"
            />
            <path
              d={path(
                offsets.map((offset, index) => [
                  300 + (160 * holes[index].states) / dosMaximum,
                  Y(Ev - offset),
                ]),
              )}
              fill="none"
              stroke={orange}
              strokeWidth="2.5"
            />
            <text x="312" y={conductionY - 11} fill={blue} className="spectrum-label">
              g꜀(E)
            </text>
            <text x="312" y={valenceY + 23} fill={orange} className="spectrum-label">
              gᵥ(E)
            </text>
            <line x1="300" x2="460" y1="337" y2="337" stroke="#a5b2ba" />
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line x1={300 + 160 * f} x2={300 + 160 * f} y1="337" y2="342" stroke="#a5b2ba" />
                <text x={300 + 160 * f} y="356" textAnchor="middle" className="spectrum-axis">
                  {sci(dosMaximum * f, 1)}
                </text>
              </g>
            ))}
            <text x="380" y="376" textAnchor="middle" className="spectrum-axis">
              States (cm⁻³/eV)
            </text>
            <line x1="550" x2="550" y1={top} y2={bottom} stroke="#a5b2ba" />
            <path
              d={path(
                Array.from({ length: 221 }, (_, index) => {
                  const energy = minEnergy + ((maxEnergy - minEnergy) * index) / 220;
                  const occupied = 1 / (1 + Math.exp((energy - Ef) / Vt));
                  return [550 + 165 * occupied, Y(energy)];
                }),
              )}
              fill="none"
              stroke={blue}
              strokeWidth="2.5"
            />
            <path
              d={path(
                Array.from({ length: 221 }, (_, index) => {
                  const energy = minEnergy + ((maxEnergy - minEnergy) * index) / 220;
                  const empty = 1 / (1 + Math.exp((Ef - energy) / Vt));
                  return [550 + 165 * empty, Y(energy)];
                }),
              )}
              fill="none"
              stroke={orange}
              strokeWidth="2.5"
            />
            <text x="562" y={conductionY - 12} fill={blue} className="spectrum-label">
              f(E)
            </text>
            <text x="562" y={valenceY + 23} fill={orange} className="spectrum-label">
              1 − f(E)
            </text>
            <text x="562" y={bottom + 22} className="spectrum-axis">
              0 → 1
            </text>
            <line x1="815" x2="815" y1={top} y2={bottom} stroke="#a5b2ba" />
            <path d={electronArea} fill={blue} opacity=".15" />
            <path d={holeArea} fill={orange} opacity=".22" />
            <path d={path(electronCurve)} fill="none" stroke={blue} strokeWidth="2.5" />
            <path d={path(holeCurve)} fill="none" stroke={orange} strokeWidth="3" />
            <text x="821" y={conductionY - 11} fill={blue} className="spectrum-label">
              n(E) = g꜀ f
            </text>
            <text x="821" y={valenceY + 23} fill={orange} className="spectrum-label">
              p(E) = gᵥ(1 − f)
            </text>
            <circle
              cx={holeCurve[peakIndex][0]}
              cy={holeCurve[peakIndex][1]}
              r="4"
              fill={orange}
              stroke="white"
              strokeWidth="1.5"
            />
            <line x1="815" x2="1009" y1="337" y2="337" stroke="#a5b2ba" />
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line x1={815 + 194 * f} x2={815 + 194 * f} y1="337" y2="342" stroke="#a5b2ba" />
                <text x={815 + 194 * f} y="356" textAnchor="middle" className="spectrum-axis">
                  {sci(
                    logSpectrum
                      ? 10 ** (logMinimum + (logMaximum - logMinimum) * f)
                      : spectrumMaximum * f,
                    1,
                  )}
                </text>
              </g>
            ))}
            <text x="912" y="376" textAnchor="middle" className="spectrum-axis">
              {logSpectrum ? 'Log scale · ' : ''}Carriers (cm⁻³/eV)
            </text>
            <circle
              cx={electronCurve[electronPeakIndex][0]}
              cy={electronCurve[electronPeakIndex][1]}
              r="4"
              fill={blue}
              stroke="white"
              strokeWidth="1.5"
            />
            {hoverEnergy !== null && (
              <line
                x1="280"
                x2="1045"
                y1={Y(hoverEnergy)}
                y2={Y(hoverEnergy)}
                stroke="#75828c"
                strokeDasharray="3 4"
              />
            )}
          </svg>
        </div>
        <div className="plot-footer">
          <span className="spectrum-footnote">
            Electron and hole spectra share an absolute axis in cm⁻³/eV. Minority carriers may be
            hard to see on the linear scale; switch to the log axis to inspect them.{' '}
            {logSpectrum && 'Zero and values below the log range lie at the left edge. '}
            Energy and density scales stay fixed as temperature changes, so the Fermi occupation
            visibly broadens.
          </span>
          <span className="inspect">{inspect}</span>
        </div>
      </div>
    </DemoLayout>
  );
}
