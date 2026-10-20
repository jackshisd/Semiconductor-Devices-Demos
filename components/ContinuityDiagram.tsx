'use client';

import { fmt, sci } from './Demos';

type Props = { deltaJn: number; deltaJp: number; generation: number; recombination: number; lengthUm: number };

export default function ContinuityDiagram({ deltaJn, deltaJp, generation, recombination, lengthUm }: Props) {
  // The current profile is centered on zero: J(left) = -ΔJ/2, J(right) = ΔJ/2.
  // Electron particle flow points opposite conventional Jn; hole flow follows Jp.
  const electronIn = deltaJn >= 0;
  const holeIn = deltaJp <= 0;
  const faceArrow = (x: number, y: number, inward: boolean, left: boolean, color: string, id: string) => {
    const direction = inward ? (left ? 1 : -1) : (left ? -1 : 1);
    return <line x1={x - direction * 28} y1={y} x2={x + direction * 28} y2={y} stroke={color} strokeWidth="3" markerEnd={'url(#' + id + ')'} />;
  };
  return <div className="plot-card continuity-card">
    <div className="plot-title"><b>Carrier balance in a {fmt(lengthUm, 0)} µm slice</b><span>Arrows at the faces follow the selected current changes</span></div>
    <svg viewBox="0 0 1000 225" role="img" aria-label="Semiconductor slice showing electron and hole flow, drift and diffusion mechanisms, pair generation and recombination">
      <defs>
        <marker id="continuity-electron-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#2672d9" /></marker>
        <marker id="continuity-hole-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#d56138" /></marker>
        <marker id="continuity-generation-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#14875f" /></marker>
        <marker id="continuity-recombination-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#7654ba" /></marker>
        <marker id="continuity-drift-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#087e95" /></marker>
        <marker id="continuity-diffusion-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#ac6b22" /></marker>
      </defs>
      <rect x="142" y="67" width="716" height="114" rx="11" fill="#f8fafb" stroke="#cbd9df" strokeWidth="2" />
      <line x1="142" y1="124" x2="858" y2="124" stroke="#e2e9ed" />
      <text x="164" y="92" fill="#2672d9" fontWeight="700" fontSize="16">Electrons</text>
      <text x="164" y="150" fill="#d56138" fontWeight="700" fontSize="16">Holes</text>
      {[92, 150].map(y => <g key={y}>
        <line x1={y === 92 ? 289 : 323} y1={y - 5} x2={y === 92 ? 323 : 289} y2={y - 5} stroke="#087e95" strokeWidth="3" markerEnd="url(#continuity-drift-arrow)" />
        <text x="337" y={y} fill="#087e95" fontSize="14" fontWeight="700">drift</text>
        <line x1={y === 92 ? 508 : 474} y1={y - 5} x2={y === 92 ? 474 : 508} y2={y - 5} stroke="#ac6b22" strokeWidth="3" markerEnd="url(#continuity-diffusion-arrow)" />
        <text x="519" y={y} fill="#ac6b22" fontSize="14" fontWeight="700">diffusion</text>
      </g>)}
      <text x="62" y="49" fill="#52636d" fontSize="14">left face</text>
      <text x="856" y="49" fill="#52636d" fontSize="14">right face</text>
      {faceArrow(94, 92, electronIn, true, '#2672d9', 'continuity-electron-arrow')}
      {faceArrow(906, 92, electronIn, false, '#2672d9', 'continuity-electron-arrow')}
      {faceArrow(94, 150, holeIn, true, '#d56138', 'continuity-hole-arrow')}
      {faceArrow(906, 150, holeIn, false, '#d56138', 'continuity-hole-arrow')}
      <line x1="602" y1="48" x2="602" y2="76" stroke="#14875f" strokeWidth="3" markerEnd="url(#continuity-generation-arrow)" />
      <text x="617" y="46" fill="#14875f" fontSize="14" fontWeight="700">Generation G {sci(generation)}</text>
      <line x1="602" y1="180" x2="602" y2="204" stroke="#7654ba" strokeWidth="3" markerEnd="url(#continuity-recombination-arrow)" />
      <text x="617" y="209" fill="#7654ba" fontSize="14" fontWeight="700">Recombination R {sci(recombination)}</text>
      <text x="272" y="207" fill="#52636d" fontSize="13">Blue: electrons · Orange: holes · Green: pair added · Purple: pair removed</text>
    </svg>
    <div className="plot-footer"><span className="spectrum-footnote">The drift and diffusion arrows illustrate possible motion. Their sizes and directions need field and concentration gradients; ΔJ sets the face-arrow directions here.</span></div>
  </div>;
}
