'use client';

import { useEffect, useState } from 'react';
import { photocarrierFrame } from '../lib/photocarrier-motion';

const stages = [
  { key: 'generation', label: '1 · Light creates pairs' },
  { key: 'diffusion', label: '2 · Electron diffuses' },
  { key: 'drift', label: '3 · Field sweeps electron' },
  { key: 'collected', label: '4 · Carrier collected' },
] as const;

export default function PhotocarrierMotionAnimation() {
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) setRunning(false);
  }, []);
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min(0.08, (now - last) / 1000);
      last = now;
      if (!document.hidden) setPhase((old) => (old + elapsed / 5) % 1);
    }, 40);
    return () => window.clearInterval(timer);
  }, [running]);
  const frame = photocarrierFrame(phase);
  return (
    <div className="photocarrier-animation">
      <p>
        Watch a photogenerated minority electron diffuse through the neutral p region, then drift
        across the reverse-biased depletion region. A pair created too far away may recombine first.
      </p>
      <div className="photocarrier-animation-stage">
        <svg
          viewBox="0 0 640 350"
          role="img"
          aria-label="Looping pn photodiode animation. A blue electron wanders from the p region to the depletion edge, then moves rapidly right through the electric field. A distant electron recombines before reaching the junction."
        >
          <defs>
            <marker
              id="photocarrier-field-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" fill="#a46b30" />
            </marker>
            <marker
              id="photocarrier-flow-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto"
            >
              <path d="M0 0L10 5L0 10Z" fill="#2672a4" />
            </marker>
          </defs>
          <rect x="42" y="67" width="208" height="234" fill="#f7e8ed" />
          <rect x="250" y="67" width="120" height="234" fill="#f9f0d9" />
          <rect x="370" y="67" width="228" height="234" fill="#e5f1fb" />
          <path d="M250 67V301M370 67V301" stroke="#ad8d4d" strokeDasharray="6 5" strokeWidth="2" />
          <text x="90" y="91" fill="#9a4d6e" fontSize="16" fontWeight="700">
            neutral p region
          </text>
          <text x="261" y="91" fill="#8f713b" fontSize="14" fontWeight="700">
            depletion
          </text>
          <text x="441" y="91" fill="#386d93" fontSize="16" fontWeight="700">
            n region
          </text>
          <path
            d="M345 120H273"
            stroke="#a46b30"
            strokeWidth="3"
            markerEnd="url(#photocarrier-field-arrow)"
          />
          <text x="279" y="113" fill="#8f713b" fontSize="13">
            electric field E
          </text>
          <path
            d="M105 227C137 235 149 194 179 203S218 187 248 187"
            fill="none"
            stroke="#2672a4"
            strokeWidth="2.5"
            strokeDasharray="4 5"
            markerEnd="url(#photocarrier-flow-arrow)"
          />
          <text x="85" y="253" fill="#2672a4" fontSize="13" fontWeight="700">
            random hops · net diffusion →
          </text>
          <path
            d="M263 187H411"
            stroke="#2672a4"
            strokeWidth="3"
            markerEnd="url(#photocarrier-flow-arrow)"
          />
          <text x="269" y="220" fill="#2672a4" fontSize="13" fontWeight="700">
            electron drift →
          </text>
          <path d="M175 102V151" stroke="#d7a42a" strokeWidth="3" strokeDasharray="5 5" />
          <path
            d="M96 105V270"
            stroke="#d7a42a"
            strokeWidth="2"
            strokeDasharray="4 6"
            opacity="0.6"
          />
          {frame.photonVisible && (
            <g transform={`translate(175 ${frame.photonY})`}>
              <circle r="9" fill="#f4cb51" stroke="#a78321" strokeWidth="2" />
              <text x="15" y="5" fill="#9b7a22" fontSize="13">
                photon
              </text>
            </g>
          )}
          {frame.electronVisible && (
            <g transform={`translate(${frame.electronX} ${frame.electronY})`}>
              <circle r="13" fill="#287abf" stroke="white" strokeWidth="2" />
              <text x="0" y="5" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">
                −
              </text>
            </g>
          )}
          {frame.photonVisible && (
            <circle cx="96" cy={frame.farPhotonY} r="6" fill="#f4cb51" opacity="0.75" />
          )}
          {frame.holeVisible && (
            <g transform={`translate(${frame.holeX} 207)`}>
              <circle r="11" fill="#cb6380" stroke="white" strokeWidth="2" />
              <text x="0" y="5" textAnchor="middle" fill="white" fontSize="15" fontWeight="700">
                +
              </text>
            </g>
          )}
          {frame.farElectronVisible && (
            <g transform={`translate(${frame.farElectronX} 280)`}>
              <circle r="10" fill="#68839a" stroke="white" strokeWidth="2" />
              <text x="0" y="4" textAnchor="middle" fill="white" fontSize="13">
                −
              </text>
            </g>
          )}
          {frame.farElectronVisible && (
            <circle cx="90" cy="280" r="8" fill="#cb6380" stroke="white" strokeWidth="2" />
          )}
          {frame.farRecombinationVisible && (
            <g>
              <text
                x="114"
                y="287"
                textAnchor="middle"
                fill="#a65363"
                fontSize="22"
                fontWeight="700"
              >
                ×
              </text>
              <text x="135" y="285" fill="#a65363" fontSize="12">
                recombines
              </text>
            </g>
          )}
          <text x="61" y="320" fill="#667685" fontSize="12">
            far from junction
          </text>
          <text x="396" y="320" fill="#386d93" fontSize="12">
            electron collected on n side →
          </text>
        </svg>
      </div>
      <div className="photocarrier-stages" aria-label="Animation stages">
        {stages.map((stage) => (
          <span key={stage.key} className={frame.stage === stage.key ? 'active' : undefined}>
            {stage.label}
          </span>
        ))}
      </div>
      <div className="photocarrier-playback">
        <button type="button" onClick={() => setRunning((old) => !old)}>
          {running ? 'Pause animation' : 'Play animation'}
        </button>
        <button type="button" onClick={() => setPhase(0)}>
          Replay
        </button>
      </div>
      <p className="photocarrier-caption">
        In the neutral region, random electron motion produces net diffusion from higher to lower
        concentration. In depletion, the electric field points left, so negative electrons drift
        right. Motion and distances are slowed and schematic.
      </p>
    </div>
  );
}
