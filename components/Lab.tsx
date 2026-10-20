'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Doping, JunctionModels, PNDepletion, BuiltIn, Degenerate, DegenerateJunctions, Schottky, SchottkyBias, Capacitance } from './Demos';
import { DriftDiffusion, MinorityDiffusion, IdealDiode, ContinuityEquation, QuasiFermiLevels } from './TransportDemos';
import { HoleDistributionDemo } from './HoleDistributionDemo';

const pages = [
  { slug: 'doping', title: 'Doping profile', subtitle: 'Donors, acceptors, and the metallurgical junction', group: 'Doping & PN junctions', Component: Doping },
  { slug: 'junction-models', title: 'Junction models', subtitle: 'Abrupt and linearly graded profiles', group: 'Doping & PN junctions', Component: JunctionModels },
  { slug: 'pn-depletion', title: 'PN depletion', subtitle: 'Charge, electric field, and potential', group: 'Doping & PN junctions', Component: PNDepletion },
  { slug: 'built-in-potential', title: 'Built-in potential', subtitle: 'Doping and equilibrium band bending', group: 'Doping & PN junctions', Component: BuiltIn },
  { slug: 'drift-diffusion', title: 'Drift & diffusion', subtitle: 'Carrier current and the Einstein relation', group: 'Carrier transport', Component: DriftDiffusion },
  { slug: 'minority-diffusion', title: 'Minority diffusion', subtitle: 'Recombination lifetime and diffusion length', group: 'Carrier transport', Component: MinorityDiffusion },
  { slug: 'continuity', title: 'Continuity equation', subtitle: 'Current divergence and carrier balance', group: 'Carrier transport', Component: ContinuityEquation },
  { slug: 'ideal-diode', title: 'Ideal PN diode', subtitle: 'Minority injection and current–voltage response', group: 'Carrier transport', Component: IdealDiode },
  { slug: 'quasi-fermi', title: 'Fermi & quasi-Fermi levels', subtitle: 'Doping, injection, and energy levels', group: 'Carrier statistics', Component: QuasiFermiLevels },
  { slug: 'hole-distribution', title: 'Electron & hole distributions', subtitle: 'Density of states × occupation = carrier spectra', group: 'Carrier statistics', Component: HoleDistributionDemo },
  { slug: 'degenerate-doping', title: 'Degenerate doping', subtitle: 'Fermi level and carrier statistics', group: 'Carrier statistics', Component: Degenerate },
  { slug: 'degenerate-junctions', title: 'Degenerate junctions', subtitle: 'PN, P⁺N, and N⁺P contacts', group: 'Carrier statistics', Component: DegenerateJunctions },
  { slug: 'schottky', title: 'Schottky contact', subtitle: 'Metal–semiconductor barrier formation', group: 'Metal contacts', Component: Schottky },
  { slug: 'schottky-bias', title: 'NiSi / Si bias cases', subtitle: 'Four contact and bias configurations', group: 'Metal contacts', Component: SchottkyBias },
  { slug: 'capacitance', title: 'C–V profiling', subtitle: 'Doping from depletion capacitance', group: 'Metal contacts', Component: Capacitance },
];

export default function Lab({ slug }: { slug: string }) {
  const [open, setOpen] = useState(true);
  const current = pages.find(page => page.slug === slug);

  return <div className="app-shell">
    <aside className={`sidebar ${open ? '' : 'closed'}`}>
      <Link href="/" className="brand">
        <span className="brand-mark">Si</span>
        <span className="brand-name">Semiconductor<br />Physics Lab</span>
      </Link>
      <nav aria-label="Experiments">
        {pages.map((page, index) => <div key={page.slug}>
          {(index === 0 || pages[index - 1].group !== page.group) && <div className="nav-group">{page.group}</div>}
          <Link href={`/${page.slug}`} className={`nav-item ${slug === page.slug ? 'selected' : ''}`}>
            <span className="nav-number">{String(index + 1).padStart(2, '0')}</span>
            <span>{page.title}</span>
          </Link>
        </div>)}
      </nav>
    </aside>

    <div className="workspace">
      <header className="topbar">
        <button className="menu-button" aria-label={open ? 'Hide navigation' : 'Show navigation'} onClick={() => setOpen(!open)}>{open ? <X size={18} /> : <Menu size={18} />}</button>
        <span>Semiconductor Physics Lab</span>
      </header>

      <main>
        {current ? <>
          <div className="page-heading">
            <Link href="/" className="back-link">← All experiments</Link>
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
          </div>
          <current.Component />
        </> : <>
          <div className="hero">
            <div className="eyebrow">INTERACTIVE LAB</div>
            <h1>Semiconductor physics</h1>
            <p>Move a slider. See how the device responds.</p>
            <Link href="/doping" className="primary-link">Open the first experiment <ArrowUpRight size={16} /></Link>
          </div>
          <div className="section-head"><h2>Experiments</h2></div>
          <div className="experiment-list">
            {pages.map((page, index) => <Link href={`/${page.slug}`} key={page.slug} className="experiment-row">
              <span className="experiment-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="experiment-copy"><strong>{page.title}</strong></span>
              <ArrowUpRight size={17} />
            </Link>)}
          </div>
        </>}
      </main>
    </div>
  </div>;
}
