'use client';

import { fmt, sci } from './Demos';
import { useChangeHighlight } from './useChangeHighlight';

type Props = { deltaJn: number; deltaJp: number; driftJn: number; driftJp: number; generation: number; recombination: number; lengthUm: number };

export default function ContinuityDiagram({ deltaJn, deltaJp, driftJn, driftJp, generation, recombination, lengthUm }: Props) {
  // The current profile is centered on zero: J(left) = -ΔJ/2, J(right) = ΔJ/2.
  // Electron particle flow points opposite conventional Jn; hole flow follows Jp.
  const electronIn = deltaJn >= 0;
  const holeIn = deltaJp <= 0;
  const diffJn = deltaJn - driftJn, diffJp = deltaJp - driftJp;
  const driftNUpdated = useChangeHighlight(driftJn);
  const diffNUpdated = useChangeHighlight(diffJn);
  const driftPUpdated = useChangeHighlight(driftJp);
  const diffPUpdated = useChangeHighlight(diffJp);
  const generationUpdated = useChangeHighlight(generation);
  const recombinationUpdated = useChangeHighlight(recombination);
  const signed = (value: number) => (value > 0 ? '+' : '') + sci(value);
  const faceArrow = (x: number, y: number, inward: boolean, left: boolean, color: string, id: string) => {
    const direction = inward ? (left ? 1 : -1) : (left ? -1 : 1);
    return <line x1={x - direction * 28} y1={y} x2={x + direction * 28} y2={y} stroke={color} strokeWidth="3" markerEnd={'url(#' + id + ')'} />;
  };
  return <div className="plot-card continuity-card">
    <div className="plot-title"><b>Carrier balance in a {fmt(lengthUm, 0)} µm slice</b><span>Current contributions across the slice (A/cm²)</span></div>
    <svg viewBox="0 0 1000 210" role="img" aria-label="Semiconductor slice showing signed electron and hole drift and diffusion current changes, and pair generation and recombination">
      <defs>
        <marker id="continuity-electron-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#2672d9" /></marker>
        <marker id="continuity-hole-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#d56138" /></marker>
        <marker id="continuity-generation-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#14875f" /></marker>
        <marker id="continuity-recombination-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#7654ba" /></marker>
        <marker id="continuity-drift-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#087e95" /></marker>
        <marker id="continuity-diffusion-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#ac6b22" /></marker>
      </defs>
      <rect x="142" y="54" width="716" height="110" rx="11" fill="#f8fafb" stroke="#cbd9df" strokeWidth="2" />
      <line x1="142" y1="109" x2="858" y2="109" stroke="#e2e9ed" />
      <text x="164" y="79" fill="#2672d9" fontWeight="700" fontSize="16">Electrons</text>
      <text x="164" y="134" fill="#d56138" fontWeight="700" fontSize="16">Holes</text>
      {[79, 134].map((y, index) => <g key={y}>
        <line x1={index === 0 ? 289 : 323} y1={y - 5} x2={index === 0 ? 323 : 289} y2={y - 5} stroke="#087e95" strokeWidth="3" markerEnd="url(#continuity-drift-arrow)" />
        <text x="337" y={y} fill="#087e95" fontSize="14" fontWeight="700">drift</text>
        <text x="337" y={y + 18} fill="#087e95" fontSize="12" className={(index === 0 ? driftNUpdated : driftPUpdated) ? 'plot-number-updated' : undefined}>{signed(index === 0 ? driftJn : driftJp)}</text>
        <line x1={index === 0 ? 508 : 474} y1={y - 5} x2={index === 0 ? 474 : 508} y2={y - 5} stroke="#ac6b22" strokeWidth="3" markerEnd="url(#continuity-diffusion-arrow)" />
        <text x="519" y={y} fill="#ac6b22" fontSize="14" fontWeight="700">diffusion</text>
        <text x="519" y={y + 18} fill="#ac6b22" fontSize="12" className={(index === 0 ? diffNUpdated : diffPUpdated) ? 'plot-number-updated' : undefined}>{signed(index === 0 ? diffJn : diffJp)}</text>
      </g>)}
      <text x="62" y="39" fill="#52636d" fontSize="14">left face</text>
      <text x="856" y="39" fill="#52636d" fontSize="14">right face</text>
      {faceArrow(94, 79, electronIn, true, '#2672d9', 'continuity-electron-arrow')}
      {faceArrow(906, 79, electronIn, false, '#2672d9', 'continuity-electron-arrow')}
      {faceArrow(94, 134, holeIn, true, '#d56138', 'continuity-hole-arrow')}
      {faceArrow(906, 134, holeIn, false, '#d56138', 'continuity-hole-arrow')}
      <line x1="704" y1="28" x2="704" y2="62" stroke="#14875f" strokeWidth="3" markerEnd="url(#continuity-generation-arrow)" />
      <text x="723" y="37" fill="#14875f" fontSize="14" fontWeight="700" className={generationUpdated ? 'plot-number-updated' : undefined}>G {sci(generation)}</text>
      <line x1="704" y1="164" x2="704" y2="190" stroke="#7654ba" strokeWidth="3" markerEnd="url(#continuity-recombination-arrow)" />
      <text x="723" y="190" fill="#7654ba" fontSize="14" fontWeight="700" className={recombinationUpdated ? 'plot-number-updated' : undefined}>R {sci(recombination)}</text>
    </svg>
    <div className="plot-footer"><span className="spectrum-footnote">G: generation adds pairs · R: recombination removes pairs. Signed values are changes in conventional current density (ΔJ), with diffusion = net − drift. Arrow directions for drift and diffusion are illustrative; physical values require field and density-gradient data.</span></div>
  </div>;
}
