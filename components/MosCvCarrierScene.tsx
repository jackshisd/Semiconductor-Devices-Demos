'use client';

import { useEffect, useState } from 'react';
import { fmt } from './Demos';

type Props = {
  gateVoltage: number;
  flatBand: number;
  threshold: number;
  depletionWidth: number;
  thresholdWidth: number;
  response: number;
  running: boolean;
  frequencyHz: number;
};

const holes = Array.from({ length: 14 }, (_, index) => index);
const surfaceHoles = Array.from({ length: 12 }, (_, index) => index);
const acceptors = Array.from({ length: 16 }, (_, index) => index);
const electrons = Array.from({ length: 12 }, (_, index) => index);

export default function MosCvCarrierScene({
  gateVoltage,
  flatBand,
  threshold,
  depletionWidth,
  thresholdWidth,
  response,
  running,
  frequencyHz,
}: Props) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let lastUpdate = 0;
    const tick = (now: number) => {
      if (now - lastUpdate >= 33) {
        setPhase((now / 1000) * Math.PI * 2 * 1.25);
        lastUpdate = now;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [running]);
  const accumulation = gateVoltage < flatBand - 0.02;
  const inversion = gateVoltage >= threshold;
  const depletionFraction = Math.min(1, depletionWidth / Math.max(thresholdWidth, 1e-12));
  const ac = Math.sin(phase);
  const edgeMotion = inversion ? (1 - response) * 9 * ac : accumulation ? 0 : 5 * ac;
  const edge = Math.max(270, Math.min(449, 270 + 165 * depletionFraction + edgeMotion));
  const inversionStrength = inversion
    ? Math.min(1, Math.max(0.2, (gateVoltage - threshold + 0.1) / 0.6))
    : 0;
  const gateSign = gateVoltage < flatBand ? '−' : '+';
  const responseText =
    inversion && response < 0.1
      ? 'Inversion electrons are nearly frozen during each AC cycle.'
      : inversion
        ? 'Inversion electrons enter and leave the surface during the AC cycle.'
        : accumulation
          ? 'Mobile holes follow the AC signal at the silicon surface.'
          : 'The depletion edge moves as holes leave or return.';
  return (
    <div className="mos-cv-scene">
      <div className="mos-cv-scene-heading">
        <strong>What changes inside the capacitor?</strong>
        <span>
          DC gate {fmt(gateVoltage, 2)} V · AC probe {fmt(frequencyHz, frequencyHz < 10 ? 2 : 0)} Hz
        </span>
      </div>
      <svg
        viewBox="0 0 800 302"
        role="img"
        aria-label={`Animated p-type MOS capacitor. ${responseText}`}
      >
        <rect x="18" y="39" width="180" height="216" rx="11" fill="#e6edf5" />
        <rect x="198" y="39" width="62" height="216" fill="#fff0d5" />
        <rect x="260" y="39" width="522" height="216" rx="11" fill="#eef8f4" />
        <rect
          x="260"
          y="39"
          width={Math.max(0, edge - 260)}
          height="216"
          fill="#dceafb"
          opacity="0.72"
        />
        <line x1="198" y1="39" x2="198" y2="255" stroke="#9aadb8" strokeWidth="2" />
        <line x1="260" y1="39" x2="260" y2="255" stroke="#9aadb8" strokeWidth="2" />
        <line x1={edge} y1="49" x2={edge} y2="246" stroke="#2672d9" strokeDasharray="5 5" />
        <text x="108" y="26" textAnchor="middle" className="mos-cv-region-label">
          gate
        </text>
        <text x="229" y="26" textAnchor="middle" className="mos-cv-region-label">
          oxide
        </text>
        <text x="520" y="26" textAnchor="middle" className="mos-cv-region-label">
          p-type silicon
        </text>
        <text x="22" y="83" className="mos-cv-region-caption">
          {gateSign} gate charge
        </text>
        {Array.from({ length: 6 }, (_, index) => (
          <text
            key={`gate-${index}`}
            x={168 + 2 * ac}
            y={75 + index * 31}
            textAnchor="middle"
            fill={gateSign === '+' ? '#bd6641' : '#7654ba'}
            fontSize="22"
            fontWeight="700"
          >
            {gateSign}
          </text>
        ))}
        {!accumulation &&
          acceptors.map((index) => {
            const x = 282 + (index % 8) * 21;
            const y = 87 + Math.floor(index / 8) * 77;
            return x < edge - 7 ? (
              <g key={`acceptor-${index}`}>
                <circle cx={x} cy={y} r="11" fill="#d8e8fc" stroke="#2672d9" />
                <text x={x} y={y + 5} textAnchor="middle" fill="#2672d9" fontSize="17">
                  −
                </text>
              </g>
            ) : null;
          })}
        {holes.map((index) => {
          const baseX = 414 + (index % 7) * 47;
          const x = Math.min(759, Math.max(baseX, edge + 25) + 5 * Math.sin(phase + index));
          const y = 91 + Math.floor(index / 7) * 91 + 5 * Math.cos(phase + index * 1.7);
          return (
            <g key={`hole-${index}`}>
              <circle cx={x} cy={y} r="11" fill="#fff4df" stroke="#c7802d" strokeWidth="1.6" />
              <text x={x} y={y + 5} textAnchor="middle" fill="#b46b1f" fontSize="17">
                +
              </text>
            </g>
          );
        })}
        {accumulation &&
          surfaceHoles.map((index) => {
            const x = 285 + (index % 3) * 19 + 5 * ac;
            const y = 82 + Math.floor(index / 3) * 40;
            return (
              <g key={`surface-hole-${index}`}>
                <circle cx={x} cy={y} r="11" fill="#ffedc9" stroke="#c7802d" strokeWidth="1.6" />
                <text x={x} y={y + 5} textAnchor="middle" fill="#b46b1f" fontSize="17">
                  +
                </text>
              </g>
            );
          })}
        {inversion &&
          electrons.map((index) => {
            const x = 284 + (index % 3) * 19 + response * 5 * ac;
            const y = 76 + Math.floor(index / 3) * 47;
            const opacity = Math.max(
              0.2,
              Math.min(1, inversionStrength * (0.8 + 0.18 * response * ac)),
            );
            return (
              <g key={`electron-${index}`} opacity={opacity}>
                <circle cx={x} cy={y} r="11" fill="#ede5fa" stroke="#7654ba" strokeWidth="1.6" />
                <text x={x} y={y + 5} textAnchor="middle" fill="#7654ba" fontSize="17">
                  −
                </text>
              </g>
            );
          })}
        {!accumulation && (
          <g stroke="#2672d9" fill="#2672d9">
            <line x1="261" x2={edge} y1="244" y2="244" strokeWidth="1.5" />
            <line x1="261" x2="261" y1="238" y2="250" strokeWidth="1.5" />
            <line x1={edge} x2={edge} y1="238" y2="250" strokeWidth="1.5" />
          </g>
        )}
        <text x="268" y="274" fill="#2672d9" fontSize="13">
          {accumulation ? 'No depletion layer' : `W ≈ ${fmt(depletionWidth * 1e7, 0)} nm`}
        </text>
        <circle cx="39" cy="291" r="6" fill="#ffedc9" stroke="#c7802d" />
        <text x="51" y="295" className="mos-cv-legend">
          mobile hole
        </text>
        <circle cx="176" cy="291" r="6" fill="#d8e8fc" stroke="#2672d9" />
        <text x="188" y="295" className="mos-cv-legend">
          fixed acceptor
        </text>
        <circle cx="330" cy="291" r="6" fill="#ede5fa" stroke="#7654ba" />
        <text x="342" y="295" className="mos-cv-legend">
          inversion electron
        </text>
      </svg>
      <p>
        {responseText} Motion is slowed for viewing; the frequency control changes which charge
        follows the probe.
      </p>
    </div>
  );
}
