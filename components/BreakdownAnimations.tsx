'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { advanceAvalanche, avalancheModel, emptyAvalanche, injectElectron, wkbEnvelope, zenerModel } from '../lib/breakdown';

function useAnimationFrames(running: boolean, speed: number, onFrame: (dt: number) => void) {
  const callback = useRef(onFrame);
  useEffect(() => { callback.current = onFrame; }, [onFrame]);
  useEffect(() => {
    if (!running) return;
    let previous = performance.now();
    // A timer also works in embedded browser surfaces without a continuous
    // compositor. Pause hidden documents and discard long background gaps.
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(.06, (now - previous) / 1000);
      previous = now;
      if (!document.hidden) callback.current(dt * speed);
    }, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [running, speed]);
}

function useMotionPreference(pause: (running: boolean) => void) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { if (media.matches) pause(false); };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [pause]);
}

function Playback({ running, toggle, step, restart, send, sendLabel }: {
  running: boolean; toggle: () => void; step: () => void; restart: () => void; send: () => void; sendLabel: string;
}) {
  return <div className="breakdown-playback" role="group" aria-label="Animation playback">
    <button className="breakdown-action primary" onClick={send}>{sendLabel}</button>
    <button className="breakdown-action" onClick={toggle} aria-pressed={!running}>{running ? 'Pause' : 'Play'}</button>
    <button className="breakdown-action" onClick={step}>Step</button>
    <button className="breakdown-action" onClick={restart}>Restart</button>
  </div>;
}

export function AvalancheAnimation({ model, speed, automatic }: {
  model: ReturnType<typeof avalancheModel>; speed: number; automatic: boolean;
}) {
  const [running, setRunning] = useState(true);
  const [scene, setScene] = useState(() => injectElectron(emptyAvalanche()));
  const arrow = useId();
  useMotionPreference(setRunning);
  useAnimationFrames(running, speed, dt => setScene(previous => advanceAvalanche(previous, model, dt, automatic && model.field > 0)));
  const send = () => setScene(previous => injectElectron(previous));
  const step = () => { setRunning(false); setScene(previous => advanceAvalanche(previous, model, .15, false)); };
  const X = (x: number) => 110 + x * 780;
  const Y = (y: number) => 100 + y * 200;
  return <section className="plot-card breakdown-animation" aria-label="Interactive impact-ionization animation">
    <div className="breakdown-animation-heading">
      <div><span className="breakdown-eyebrow">CARRIER LAB · AVALANCHE</span><h2>One electron starts a chain reaction</h2></div>
      <Playback running={running} toggle={() => setRunning(value => !value)} step={step}
        restart={() => setScene(injectElectron(emptyAvalanche()))} send={send} sendLabel="Inject electron" />
    </div>
    <div className="breakdown-scene-scroll">
      <svg className="breakdown-scene" viewBox="0 0 1000 380" role="button" tabIndex={0}
        aria-label="Inject an electron into the depletion region. Electrons travel right; holes travel left. Click to choose an injection position."
        onClick={event => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) * 1000 / bounds.width - 110) / 780;
          const y = ((event.clientY - bounds.top) * 380 / bounds.height - 100) / 200;
          setScene(previous => injectElectron(previous, x, y));
        }}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); send(); } }}>
        <defs><marker id={arrow} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="#7654ba" /></marker></defs>
        <rect x="20" y="92" width="90" height="216" rx="12" fill="#fff1ea" />
        <rect x="110" y="92" width="780" height="216" fill="#f4f8fb" stroke="#d6e1e7" />
        <rect x="890" y="92" width="90" height="216" rx="12" fill="#e9f2ff" />
        <text x="65" y="80" textAnchor="middle" className="breakdown-svg-label">P side</text>
        <text x="935" y="80" textAnchor="middle" className="breakdown-svg-label">N side</text>
        <text x="500" y="32" textAnchor="middle" className="breakdown-svg-heading">REVERSE ELECTRIC FIELD</text>
        <line x1="650" x2="350" y1="53" y2="53" stroke="#7654ba" strokeWidth="3" markerEnd={'url(#' + arrow + ')'} opacity={model.field === 0 ? .2 : 1} />
        <text x="500" y="80" textAnchor="middle" className="breakdown-svg-small">Depleted silicon · click anywhere to inject a seed</text>
        {Array.from({ length: 60 }, (_, index) => <g key={index} opacity=".45">
          <circle cx={140 + index % 12 * 65} cy={120 + Math.floor(index / 12) * 40} r="9" fill="#fff" stroke="#b5c5cf" />
          <circle cx={140 + index % 12 * 65} cy={120 + Math.floor(index / 12) * 40} r="2" fill="#b5c5cf" />
        </g>)}
        {scene.flashes.map(flash => <g key={flash.id} opacity={1 - flash.age / .55}>
          <circle cx={X(flash.x)} cy={Y(flash.y)} r={10 + flash.age * 55} fill="none" stroke="#17a574" strokeWidth="3" />
          <text x={X(flash.x)} y={Y(flash.y) - 23} textAnchor="middle" fill="#087855" fontSize="12" fontWeight="700">+ e⁻ / h⁺ pair</text>
        </g>)}
        {scene.particles.map(particle => {
          const electron = particle.kind === 'electron';
          return <g key={particle.id}>
            <line x1={X(particle.x) + (electron ? -18 : 14)} x2={X(particle.x)} y1={Y(particle.y)} y2={Y(particle.y)} stroke={electron ? '#2672d9' : '#d56138'} opacity=".35" strokeWidth="3" />
            <circle cx={X(particle.x)} cy={Y(particle.y)} r="7" fill={electron ? '#2672d9' : '#fff3e8'} stroke={electron ? '#fff' : '#d56138'} strokeWidth="2" />
            <text x={X(particle.x)} y={Y(particle.y) + 4} textAnchor="middle" fill={electron ? '#fff' : '#b44c22'} fontSize="12" fontWeight="800">{electron ? '−' : '+'}</text>
          </g>;
        })}
        <text x="65" y="335" textAnchor="middle" fill="#b44c22" fontSize="13">holes ←</text>
        <text x="935" y="335" textAnchor="middle" fill="#2672d9" fontSize="13">→ electrons</text>
        {[0, .25, .5, .75, 1].map(fraction => <g key={fraction}>
          <line x1={X(fraction)} x2={X(fraction)} y1="308" y2="315" stroke="#9cabb7" />
          <text x={X(fraction)} y="335" textAnchor="middle" className="breakdown-svg-small">{Number((fraction * model.widthUm).toFixed(2))} µm</text>
        </g>)}
        <text x="500" y="365" textAnchor="middle" className="breakdown-svg-small">Accelerate → impact ionization → a new electron and hole → multiplication</text>
      </svg>
    </div>
    <div className="breakdown-animation-footer">
      <div className="breakdown-live-counts"><span>Seeds <b>{scene.seeded}</b></span><span>Pairs created <b>{scene.pairs}</b></span><span>Electrons collected <b>{scene.collectedElectrons}</b></span></div>
      <span className="breakdown-status">{model.field === 0 ? 'No field · no drift or ionization' : running ? 'Live · illustrative slow motion' : 'Paused · step to inspect'}</span>
    </div>
    <p className="breakdown-caption">Blue: electrons moving against the field. Orange: holes moving with it. Each impact adds a neutral electron–hole pair. This animation includes electron-triggered ionization; hole-triggered feedback is omitted.{scene.limited && ' Large cascades are limited to 160 visible carriers; the multiplication graph remains uncapped.'}</p>
  </section>;
}

function wavePath(from: number, to: number, center: number, amplitude: number, y: number, phase: number) {
  return Array.from({ length: 120 }, (_, index) => {
    const x = from + (to - from) * index / 119;
    const envelope = Math.exp(-.5 * ((x - center) / 27) ** 2);
    return (index ? 'L' : 'M') + x.toFixed(2) + ',' + (y + amplitude * envelope * Math.sin(x * .3 - phase)).toFixed(2);
  }).join(' ');
}

export function ZenerAnimation({ model, speed, repeat }: {
  model: ReturnType<typeof zenerModel>; speed: number; repeat: boolean;
}) {
  const [running, setRunning] = useState(true);
  const [time, setTime] = useState(0);
  const id = useId();
  const duration = 4.2;
  useMotionPreference(setRunning);
  useAnimationFrames(running, speed, dt => setTime(previous => repeat ? (previous + dt) % duration : Math.min(duration, previous + dt)));
  useEffect(() => { if (!repeat && time >= duration) setRunning(false); }, [repeat, time]);
  const launch = () => { setTime(0); setRunning(true); };
  const step = () => { setRunning(false); setTime(previous => repeat ? (previous + .15) % duration : Math.min(duration, previous + .15)); };
  const left = 230, right = 790;
  const X = (x: number) => left + x / model.widthNm * (right - left);
  const maxEnergy = model.bandgap + .65, minEnergy = -model.voltageDrop - .45;
  const Y = (energy: number) => 58 + (maxEnergy - energy) / (maxEnergy - minEnergy) * 282;
  const y0 = Y(0);
  const barrierNm = Math.min(model.widthNm, model.tunnelDistanceNm);
  const end = X(barrierNm);
  const tunnelX = model.channelOpen ? X(model.tunnelDistanceNm) : right;
  const splitting = time >= 1.25;
  const incidentCenter = left - 150 + Math.min(time / 1.4, 1) * 150;
  const reflectedCenter = left - (time - 1.25) * 85;
  const transmittedCenter = tunnelX + (time - 1.25) * 180;
  const pulse = splitting ? Math.exp(-.6 * (time - 1.5) ** 2) : Math.min(1, time / .8);
  const tail = Array.from({ length: 100 }, (_, index) => {
    const position = barrierNm * index / 99;
    return (index ? 'L' : 'M') + X(position).toFixed(2) + ',' + (y0 - 22 * wkbEnvelope(model, position) * pulse).toFixed(2);
  }).join(' ');
  return <section className="plot-card breakdown-animation" aria-label="Interactive interband quantum-tunneling animation">
    <div className="breakdown-animation-heading">
      <div><span className="breakdown-eyebrow">WAVE LAB · ZENER</span><h2>An electron wave reaches across the gap</h2></div>
      <Playback running={running} toggle={() => { if (time >= duration) setTime(0); setRunning(value => !value); }}
        step={step} restart={() => setTime(0)} send={launch} sendLabel="Launch wave packet" />
    </div>
    <div className="breakdown-scene-scroll">
      <svg className="breakdown-scene" viewBox="0 0 1000 410" role="button" tabIndex={0}
        aria-label="Launch an electron wave packet. A decaying evanescent wave crosses the forbidden bandgap, with reflected and transmitted wave packets."
        onClick={launch} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); launch(); } }}>
        <defs><clipPath id={id}><rect x="65" y="50" width="870" height="295" /></clipPath></defs>
        <rect x="65" y="50" width="165" height="295" rx="8" fill="#fff3eb" />
        <rect x={left} y="50" width={right - left} height="295" fill="#f5f2fc" />
        <rect x={right} y="50" width="145" height="295" rx="8" fill="#eaf3ff" />
        <text x="140" y="31" textAnchor="middle" className="breakdown-svg-label">P⁺ · valence states</text>
        <text x="510" y="31" textAnchor="middle" className="breakdown-svg-label">Narrow junction</text>
        <text x="860" y="31" textAnchor="middle" className="breakdown-svg-label">N⁺ · conduction states</text>
        <g clipPath={'url(#' + id + ')'}>
          <polygon points={left + ',' + Y(model.bandgap) + ' ' + end + ',' + Y(Math.max(0, model.bandgap - model.voltageDrop)) + ' ' + end + ',' + y0 + ' ' + left + ',' + y0}
            fill="#9c7bdd" opacity=".18" />
          <polyline points={'65,' + Y(model.bandgap) + ' ' + left + ',' + Y(model.bandgap) + ' ' + right + ',' + Y(model.bandgap - model.voltageDrop) + ' 935,' + Y(model.bandgap - model.voltageDrop)}
            fill="none" stroke="#2672d9" strokeWidth="3" />
          <polyline points={'65,' + y0 + ' ' + left + ',' + y0 + ' ' + right + ',' + Y(-model.voltageDrop) + ' 935,' + Y(-model.voltageDrop)}
            fill="none" stroke="#14875f" strokeWidth="3" />
          <line x1="65" x2="935" y1={y0} y2={y0} stroke="#6c7993" strokeDasharray="5 5" opacity=".6" />
          {time < 1.65 && <path d={wavePath(65, left, incidentCenter, 22, y0, time * 12)} fill="none" stroke="#2672d9" strokeWidth="2.5" />}
          <path d={tail} fill="none" stroke="#8b4cc4" strokeWidth="2.5" />
          {splitting && <path d={wavePath(65, left, reflectedCenter, 22 * Math.sqrt(model.reflection), y0, -time * 12)} fill="none" stroke="#d56138" strokeWidth="2.5" />}
          {splitting && model.transmission > 0 && <path d={wavePath(tunnelX, 935, transmittedCenter, 22 * Math.sqrt(model.transmission), y0, time * 12)} fill="none" stroke="#2672d9" strokeWidth="3" />}
          {time < 1.25 && <circle cx={incidentCenter} cy={y0} r="5" fill="#2672d9" />}
          {splitting && model.transmission > 0 && transmittedCenter < 930 && <circle cx={transmittedCenter} cy={y0} r="5" fill="#2672d9" opacity={Math.sqrt(model.transmission)} />}
          {splitting && reflectedCenter > 70 && <circle cx={reflectedCenter} cy={y0} r="5" fill="#d56138" opacity={Math.sqrt(model.reflection)} />}
        </g>
        <text x="73" y={Y(model.bandgap) - 9} fill="#2672d9" fontSize="13" fontWeight="700">Eᴄ</text>
        <text x="73" y={y0 + 19} fill="#14875f" fontSize="13" fontWeight="700">Eᵥ · incident energy</text>
        <text x="920" y={y0 - 15} textAnchor="end" fill="#2672d9" fontSize="13" fontWeight="700">{model.channelOpen ? 'Transmitted probability ' + (model.transmission * 100).toPrecision(3) + '%' : 'No accessible final state at this energy'}</text>
        <line x1={left} x2={end} y1="359" y2="359" stroke="#8b4cc4" strokeWidth="2" />
        <line x1={left} x2={left} y1="353" y2="365" stroke="#8b4cc4" strokeWidth="2" />
        <line x1={end} x2={end} y1="353" y2="365" stroke="#8b4cc4" strokeWidth="2" />
        <text x={(left + end) / 2} y="382" textAnchor="middle" fill="#7654ba" fontSize="13">{model.channelOpen ? 'Tunnel distance ' + model.tunnelDistanceNm.toFixed(2) + ' nm' : 'Barrier extends beyond the junction'}</text>
        <text x="860" y="382" textAnchor="middle" className="breakdown-svg-small">W = {model.widthNm.toFixed(1)} nm</text>
      </svg>
    </div>
    <div className="breakdown-animation-footer">
      <div className="breakdown-wave-legend"><span><i style={{ background: '#2672d9' }} />Electron wave</span><span><i style={{ background: '#8b4cc4' }} />Evanescent tail</span><span><i style={{ background: '#d56138' }} />Reflection</span></div>
      <span className="breakdown-status">{!model.channelOpen ? 'Increase voltage to open a final state' : time < 1.25 ? 'Incident packet approaches' : 'Reflected and transmitted amplitudes'}</span>
    </div>
    <p className="breakdown-caption">The purple tail decays across the classically forbidden gap; there is no classical particle path inside it. The outgoing wave scales with √T. These branches show probability amplitudes for repeated trials, rather than a fraction of one electron. Energy stays fixed during elastic tunneling.</p>
  </section>;
}
