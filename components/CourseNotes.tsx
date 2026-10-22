'use client';
import Link from 'next/link';
import type { ExperimentSlug } from '../lib/experiments';
import { lectureAssociations } from '../lib/slide-demo-assignments';

const notes: Record<ExperimentSlug, string> = {
  'phonon-scattering':
    'Phonons describe lattice vibrations. Increasing temperature increases lattice scattering and reduces phonon-limited mobility, with μphonon proportional to T⁻³ᐟ² in the course model. Individual electron paths are schematic, not a microscopic quantum simulation.',
  'impurity-scattering':
    'Ionized dopants deflect mobile electrons through Coulomb forces. Faster electrons change direction less when passing an ion. The course scaling is μimpurity proportional to T³ᐟ²/(ND + NA). The animation isolates this mechanism and uses illustrative screened trajectories.',
  'electron-hole-motion':
    'Conduction electrons are mobile negative charge. A valence-band hole is an unoccupied state: when a neighboring electron fills it, the vacancy moves in the opposite direction. Under an electric field electrons drift opposite the field and holes drift with it; both contribute conventional current along the field. Lecture 2 introduces the two carriers; Lecture 3 develops drift current.',
  'band-formation':
    'Silicon’s isolated 3s and 3p states become closely spaced bands in a crystal. N atoms contribute 4N valence states and 4N conduction states. Near each band edge, the three-dimensional density of states grows as the square root of the energy measured from that edge.',
  'doping-carriers':
    'Donors supply electrons and acceptors supply holes. With complete ionization, charge neutrality and np = ni² determine the equilibrium carrier concentrations. The slides give donor and acceptor energies of 54 meV for As and 45 meV for B.',
  'thermal-equilibrium':
    'At thermal equilibrium, inverse processes balance on average and carriers continue to exchange energy. The sand dish on a vibrating table is the analogy on Lecture 2, slide 29.',
  'boltzmann-approximation':
    'Use the electron Boltzmann tail when E − EF exceeds 3kT, and the hole tail when EF − E exceeds 3kT. The exact occupation function remains the Fermi–Dirac function.',
  'intrinsic-carriers':
    'Intrinsic silicon has n = p = ni. The temperature curve uses the carrier-density equation in Lecture 3 with the slides’ fixed Si gap of 1.12 eV, Nc(300 K) = 2.82 × 10¹⁹ cm⁻³ and Nv(300 K) = 1.83 × 10¹⁹ cm⁻³. Nc and Nv scale as T³ᐟ². Lecture 1 introduces the concentration and its temperature trend.',
  doping:
    'The metallurgical junction occurs where the net donor-minus-acceptor concentration changes sign. The adjustable spatial profile is a schematic illustration of the doped regions in Lecture 6.',
  'pn-depletion':
    'The depletion approximation retains fixed ionized dopant charge and neglects mobile charge inside the depletion region. Integrating Poisson’s equation gives the electric field and potential. Charge neutrality requires NA xp = ND xn.',
  'built-in-potential':
    'In a nondegenerate PN junction at equilibrium, the Fermi level is flat and Vbi = VT ln(NA ND / ni²). Heavily doped junction approximations are treated separately on the following slide.',
  'drift-diffusion':
    'Total carrier current combines drift in an electric field and diffusion down a concentration gradient. Electron and hole diffusion terms have opposite signs. The Einstein relation is D/μ = kT/q.',
  'minority-diffusion':
    'For a steady, low-level excess minority population in a field-free neutral region, recombination and diffusion give an exponential spatial decay with diffusion length L = √(Dτ).',
  continuity:
    'Continuity counts carrier accumulation, current entering and leaving, generation, and recombination. Electron and hole current-divergence terms have opposite signs because their charges differ.',
  'ideal-diode':
    'The ideal diode derivation assumes steady state, low-level injection, nondegenerate neutral regions, and no generation or recombination in the depletion region. Reverse saturation and forward injection follow from the minority-carrier boundary conditions. Lecture 8 adds a qualitative breakdown curve.',
  'avalanche-breakdown':
    'An energetic carrier gains enough energy between collisions to create an electron–hole pair. The additional carriers can cause further impact ionization. The slides estimate breakdown from the maximum junction field reaching a critical field; they do not specify a multiplication-current law.',
  'zener-breakdown':
    'Heavy doping makes the depletion region narrow. Occupied valence states can align with available conduction states across the junction, allowing tunneling. The slides describe widths around or below 10 nm, critical fields around 10⁶ V/cm, and breakdown typically below 5 V.',
  'quasi-fermi':
    'Outside equilibrium, electron and hole concentrations can be described by separate quasi-Fermi levels. Optical pair generation adds equal excess electron and hole concentrations. At equilibrium the two levels coincide.',
  'hole-distribution':
    'Multiply the conduction-band density of states by f(E) for the electron spectrum, and the valence-band density of states by 1 − f(E) for the hole spectrum. Integrating each spectrum gives its carrier concentration.',
  'degenerate-doping':
    'Boltzmann statistics apply when EF is at least 3kT from both band edges. Lecture 3 quotes 300 K degeneracy thresholds of ND > 1.6 × 10¹⁸ cm⁻³ or NA > 9.1 × 10¹⁷ cm⁻³. In heavily doped material EF approaches or enters a band.',
  'degenerate-junctions':
    'Lecture 6 approximates the heavily doped side’s Fermi level at a band edge. This gives qVbi ≈ Eg/2 + kT ln(Nlight/ni), provided the other side remains nondegenerate.',
  schottky:
    'The ideal electron barrier is ΦBn = ΦM − χ. The measured barrier tables in Lecture 5 account for interface effects. Its NiSi row lists ΦM = 4.65 eV, ΦBn = 0.65 eV and ΦBp = 0.47 eV.',
  'schottky-bias':
    'Applied bias changes the potential drop and depletion width while the interface barrier is held fixed in the course model. The NiSi values come from Lecture 5’s silicide table: ΦBn = 0.65 eV and ΦBp = 0.47 eV.',
  capacitance:
    'Depletion capacitance is C = εs A/W. The slope of 1/C² against bias determines the dopant density, and the intercept determines the built-in potential under the depletion approximation.',
};
export default function CourseNotes({ slug }: { slug: ExperimentSlug }) {
  const sources = Object.entries(lectureAssociations).flatMap(([id, associations]) =>
    associations[slug] ? [{ id, page: associations[slug]![0] }] : [],
  );
  if (slug === 'ideal-diode') sources.push({ id: 'lecture-8', page: 4 });
  if (slug === 'electron-hole-motion') sources.push({ id: 'lecture-3', page: 26 });
  return (
    <section className="course-notes">
      <h2>From the lecture slides</h2>
      <p>{notes[slug]}</p>
      <nav aria-label="Source slides">
        {sources.map(({ id, page }) => (
          <Link key={`${id}-${page}`} href={`/lectures/${id}#slide=${page}`}>
            Lecture {id.split('-')[1]} · slide {page} →
          </Link>
        ))}
      </nav>
    </section>
  );
}
