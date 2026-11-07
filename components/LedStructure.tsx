'use client';

import { useEffect, useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, sci, useParams } from './Demos';
import { ledEmission } from '../lib/opto-structures';

const presets = [
  { label: 'Red · 650 nm', bandGapEv: 1240 / 650 },
  { label: 'Green · 570 nm', bandGapEv: 1240 / 570 },
  { label: 'Blue · 450 nm', bandGapEv: 1240 / 450 },
];

export default function LedStructure() {
  const { v, set, reset } = useParams({
    bandGapEv: 1240 / 570,
    currentMa: 15,
    radiativePercent: 75,
  });
  const [running, setRunning] = useState(true);
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) setRunning(false);
  }, []);
  useEffect(() => {
    if (!running || v.currentMa === 0) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      if (!document.hidden) setPhase((old) => (old + dt / (3.2 - v.currentMa * 0.065)) % 1);
    }, 40);
    return () => window.clearInterval(timer);
  }, [running, v.currentMa]);
  const state = ledEmission({
    bandGapEv: v.bandGapEv,
    currentMa: v.currentMa,
    radiativeFraction: v.radiativePercent / 100,
  });
  const topY = 100;
  const bottomY = topY + v.bandGapEv * 62;
  const approach = Math.min(1, phase * 2);
  const electronX = 470 - 150 * approach;
  const electronY = topY + Math.min(1, Math.max(0, (phase - 0.5) / 0.3)) * (bottomY - topY);
  const holeX = 170 + 150 * approach;
  const photonVisible = phase > 0.8 && v.radiativePercent > 0 && v.currentMa > 0;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setPhase(0);
            setRunning(true);
          }}
          items={[
            {
              key: 'bandGapEv',
              label: 'Direct band gap E₉',
              min: 1.7,
              max: 3.1,
              step: 0.01,
              unit: 'eV',
            },
            { key: 'currentMa', label: 'Forward current', min: 0, max: 30, step: 1, unit: 'mA' },
            {
              key: 'radiativePercent',
              label: 'Radiative recombination fraction',
              min: 0,
              max: 100,
              step: 1,
              unit: '%',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="LED color presets">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={Math.abs(v.bandGapEv - preset.bandGapEv) < 0.005 ? 'active' : undefined}
                onClick={() => {
                  set('bandGapEv', preset.bandGapEv);
                  setPhase(0);
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="chips" role="group" aria-label="Animation playback">
            <button type="button" onClick={() => setRunning((old) => !old)}>
              {running ? 'Pause motion' : 'Play motion'}
            </button>
            <button type="button" onClick={() => setPhase(0)}>
              Replay
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Photon energy follows the direct band gap"
          forms={[
            {
              label: 'Radiative electron–hole recombination',
              formula: String.raw`E_{\rm photon}\approx E_g,\qquad \lambda(\mu\mathrm m)\approx\frac{1.24}{E_g(\mathrm{eV})}`,
            },
            {
              label: 'Illustrative generated-photon rate',
              formula: String.raw`R_{\gamma}=\eta_{\rm rad}\frac{I}{q}`,
            },
          ]}
          substitution={String.raw`E_g=${fmt(v.bandGapEv, 2)}\,\mathrm{eV},\quad \lambda=${fmt(state.wavelengthNm, 0)}\,\mathrm{nm},\quad \eta_{\rm rad}=${fmt(v.radiativePercent, 0)}\%`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Forward bias injects electrons from the n side and holes from the p side. When an electron
        drops into a hole in a direct-band-gap semiconductor, their energy can leave as a photon.
        Change the band gap to change photon wavelength and color.
      </p>
      <div className="opto-diagram-frame">
        <svg
          viewBox="0 0 640 390"
          role="img"
          aria-label={`LED band diagram. Electron and hole move toward the junction; direct recombination produces ${fmt(state.wavelengthNm, 0)} nanometer light.`}
        >
          <defs>
            <marker
              id="led-carrier-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10Z" fill="#61798b" />
            </marker>
          </defs>
          <rect x="55" y="42" width="260" height="292" rx="10" fill="#f8eaf0" />
          <rect x="315" y="42" width="260" height="292" rx="10" fill="#eaf2fb" />
          <text x="77" y="71" fill="#a04e70" fontWeight="700" fontSize="18">
            p side
          </text>
          <text x="505" y="71" fill="#386992" fontWeight="700" fontSize="18">
            n side
          </text>
          <path d="M95 70H255Q300 70 330 100H545" fill="none" stroke="#385a73" strokeWidth="4" />
          <path
            d={`M95 ${bottomY - 30}H255Q300 ${bottomY - 30} 330 ${bottomY}H545`}
            fill="none"
            stroke="#a75470"
            strokeWidth="4"
          />
          <text x="548" y="105" fill="#385a73" fontWeight="700" fontSize="15">
            E꜀
          </text>
          <text x="548" y={bottomY + 5} fill="#a75470" fontWeight="700" fontSize="15">
            Eᵥ
          </text>
          <path
            d={`M510 111V${bottomY - 10}`}
            stroke="#7b8390"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
          <text x="470" y={(topY + bottomY) / 2} fill="#667788" fontSize="14">
            E₉ = {fmt(v.bandGapEv, 2)} eV
          </text>
          <path
            d="M459 126H356"
            stroke="#61798b"
            strokeWidth="2"
            markerEnd="url(#led-carrier-arrow)"
          />
          <path
            d={`M181 ${bottomY + 17}H282`}
            stroke="#61798b"
            strokeWidth="2"
            markerEnd="url(#led-carrier-arrow)"
          />
          <circle
            cx={electronX}
            cy={electronY}
            r="13"
            fill="#2e7fbb"
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={electronX}
            y={electronY + 5}
            textAnchor="middle"
            fill="white"
            fontWeight="700"
            fontSize="16"
          >
            −
          </text>
          <circle cx={holeX} cy={bottomY} r="13" fill="#d25e7b" stroke="white" strokeWidth="2" />
          <text
            x={holeX}
            y={bottomY + 5}
            textAnchor="middle"
            fill="white"
            fontWeight="700"
            fontSize="16"
          >
            +
          </text>
          {photonVisible && (
            <g fill="none" stroke={state.photonColor} strokeWidth="4" strokeLinecap="round">
              <path d={`M320 ${bottomY - 20}q-11 -13 0 -26t0 -26t0 -26`} />
              <path d={`M320 ${bottomY - 78}l0 -30`} strokeDasharray="4 6" />
            </g>
          )}
          <text x="70" y="358" fill="#4f6677" fontSize="14">
            hole injection →
          </text>
          <text x="397" y="358" fill="#4f6677" fontSize="14">
            ← electron injection
          </text>
        </svg>
      </div>
      <Metrics>
        <Metric label="Photon wavelength" value={fmt(state.wavelengthNm, 0)} unit="nm" />
        <Metric
          label="Injected pairs per second"
          value={sci(state.injectedPairsPerSecond)}
          unit="s⁻¹"
        />
        <Metric
          label="Radiative photons generated"
          value={sci(state.generatedPhotonsPerSecond)}
          unit="s⁻¹"
        />
      </Metrics>
      <p className="carrier-motion-summary" role="status">
        {v.currentMa === 0
          ? 'With no forward current, the animation stops and there are no injected pairs.'
          : v.radiativePercent === 0
            ? 'Pairs are injected, but this setting sends their recombination energy to nonradiative channels rather than photons.'
            : `At ${fmt(v.bandGapEv, 2)} eV, an emitted photon has an approximate wavelength of ${fmt(state.wavelengthNm, 0)} nm. More current increases the rate of injected pairs.`}
      </p>
      <p className="carrier-motion-summary">
        The animation is slowed for visibility. The photon-rate estimate assumes one injected
        electron–hole pair per charge q and applies the chosen internal radiative fraction; it does
        not include light-extraction losses or device heating.
      </p>
    </DemoLayout>
  );
}
