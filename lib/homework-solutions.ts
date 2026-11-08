import type { ExperimentSlug } from './experiments';

export type HomeworkAnnotation = {
  page: number;
  x: number;
  y: number;
  label: string;
  text: string;
};
export type HomeworkProblem = {
  number: number;
  title: string;
  page: number;
  demos: ExperimentSlug[];
};
export type HomeworkSet = {
  id: string;
  title: string;
  file: string;
  pages: number;
  problems: HomeworkProblem[];
  annotations: HomeworkAnnotation[];
};

export const homeworkSets: HomeworkSet[] = [
  {
    id: 'hw1',
    title: 'Homework 1 solutions',
    file: '/homework/hw1-solutions.pdf',
    pages: 4,
    problems: [
      {
        number: 1,
        title: 'Energy band model',
        page: 1,
        demos: ['intrinsic-carriers', 'band-formation'],
      },
      {
        number: 2,
        title: 'Fermi–Dirac distribution',
        page: 1,
        demos: ['boltzmann-approximation', 'hole-distribution'],
      },
      {
        number: 3,
        title: 'Carrier concentrations',
        page: 2,
        demos: ['doping-carriers', 'carrier-temperature-regions'],
      },
      {
        number: 4,
        title: 'Mobility and drift',
        page: 2,
        demos: ['thermal-drift', 'matthiessen-rule'],
      },
      {
        number: 5,
        title: 'Resistivity',
        page: 3,
        demos: ['doping-carriers', 'conductivity-resistivity'],
      },
    ],
    annotations: [
      {
        page: 1,
        x: 0.73,
        y: 0.19,
        label: 'Problem 1(a): band-gap change',
        text: 'At fixed temperature the effective densities of states cancel in the ratio of intrinsic concentrations. A 0.078 eV gap reduction gives nᵢ,new/nᵢ,old = exp[0.078/(2 × 0.026)] ≈ 4.48. The new concentration is 4.48 times the old one, so the percentage increase is (4.48 − 1) × 100% = 348%.',
      },
      {
        page: 1,
        x: 0.74,
        y: 0.52,
        label: 'Problem 1(b): temperature change',
        text: 'Now both parts of nᵢ(T) change. Because N꜀ and Nᵥ each scale as T³ᐟ², their geometric mean also scales as T³ᐟ². The exponential gap factor changes much more strongly between 300 K and 600 K. Using the stated constant 1.068 eV gap gives a ratio near 8.5 × 10⁴. This is an additional temperature effect, separate from part (a).',
      },
      {
        page: 1,
        x: 0.72,
        y: 0.69,
        label: 'Problem 1(c): gap at high temperature',
        text: 'The supplied solution attributes semimetal-like behavior to thermal expansion reducing the band gap. That is a qualitative picture; the actual gap depends on electron–phonon interactions as well as lattice expansion, and the simple fixed-gap formula becomes unreliable at extreme temperatures. The key idea is that a smaller gap greatly increases thermally available carriers.',
      },
      {
        page: 1,
        x: 0.73,
        y: 0.94,
        label: 'Problem 2(a–b): Fermi occupation',
        text: 'At E = Eꜰ, the Fermi–Dirac exponent is zero, so f = 1/(1+1) = 0.5. If Eꜰ = E꜀ and E = E꜀+kT, the exponent is one and f = 1/(1+e) ≈ 0.269. This uses the exact Fermi function rather than a Boltzmann approximation close to Eꜰ.',
      },
      {
        page: 2,
        x: 0.73,
        y: 0.29,
        label: 'Problem 2(c): symmetry around Eꜰ',
        text: 'Fermi–Dirac occupancy obeys f(Eꜰ+δ) = 1−f(Eꜰ−δ). The energies E꜀+kT and E꜀+3kT are symmetric around E꜀+2kT. Setting filled probability at the first equal to empty probability at the second therefore places Eꜰ at their midpoint: Eꜰ = E꜀+2kT.',
      },
      {
        page: 2,
        x: 0.74,
        y: 0.67,
        label: 'Problem 3: boron and intrinsic crossover',
        text: 'Boron is an acceptor, so at 300 K the majority holes are approximately Nᴀ = 10¹⁷ cm⁻³. Using np = nᵢ² with nᵢ ≈ 10¹⁰ cm⁻³ gives minority electrons n ≈ 10³ cm⁻³. For part (b), “intrinsic” means nᵢ is well above the dopant concentration; the provided plot places nᵢ ≈ 10¹⁸ cm⁻³ near 1000 K. That estimate depends on the plotted temperature model.',
      },
      {
        page: 3,
        x: 0.76,
        y: 0.25,
        label: 'Problem 4(a): temperature-stable resistance',
        text: 'Near 300 K, an extrinsic sample may have nearly constant carrier density, so resistivity changes mainly through mobility. Phonon- and impurity-limited mobilities have opposite temperature trends. The solution chooses an n-type doping range where those trends partly offset, making mobility and therefore resistivity less sensitive to temperature. The exact optimum should be read from measured mobility curves.',
      },
      {
        page: 3,
        x: 0.75,
        y: 0.43,
        label: 'Problem 4(b-i): drift and mean free path',
        text: 'First use vᴅ = μₚE to get μₚ = (1.75 × 10⁵)/(1000) = 175 cm²/(V·s). Then μₚ = qτ/mₚ* gives τ, and ℓ = vₜₕτ gives mean free path. With the supplied effective mass and thermal speed, ℓ is about 7 nm. Drift speed and thermal speed play different roles in these two steps.',
      },
      {
        page: 3,
        x: 0.76,
        y: 0.56,
        label: 'Problem 4(b-ii): check the doping estimate',
        text: 'The solution’s text mentions Nᴀ ≈ 10¹⁷ cm⁻³ at μₚ = 350 cm²/(V·s), but the mobility calculated just above is 175 cm²/(V·s). Its final p ≈ 10¹⁸ cm⁻³ and n ≈ 10² cm⁻³ instead correspond to a higher acceptor density. Treat the intermediate 10¹⁷/350 statement as an apparent typo and use the mobility-versus-doping graph with μₚ = 175.',
      },
      {
        page: 3,
        x: 0.76,
        y: 0.9,
        label: 'Problem 5(a): compensation and resistivity',
        text: 'With boron alone, p ≈ 2 × 10¹⁶ cm⁻³ and n = nᵢ²/p ≈ 5 × 10³ cm⁻³. Adding 6 × 10¹⁶ cm⁻³ phosphorus leaves net donors Nᴅ−Nᴀ = 4 × 10¹⁶ cm⁻³, making the sample n-type. Use net doping for carrier density but total ionized dopants for mobility scattering. The supplied graph then gives μₙ ≈ 820 cm²/(V·s) and ρ ≈ 0.19 Ω·cm.',
      },
      {
        page: 4,
        x: 0.74,
        y: 0.14,
        label: 'Problem 5(b): nanoscale geometry',
        text: 'Use R = ρL/(Wt), then solve ρ ≤ RₘₐₓWt/L. With L = 10 nm, W = 100 nm, t = 2 nm, and Rₘₐₓ = 100 Ω, the limit is 2 × 10⁻⁴ Ω·cm. This is an extremely low resistivity. The solution estimates about 6 × 10²⁰ cm⁻³ donors from a course plot; at such high doping, solubility, degeneracy, and mobility models deserve extra scrutiny.',
      },
    ],
  },
  {
    id: 'hw2',
    title: 'Homework 2 solutions',
    file: '/homework/hw2-solutions.pdf',
    pages: 4,
    problems: [
      {
        number: 1,
        title: 'Minority recombination lifetime',
        page: 1,
        demos: ['generation-processes', 'recombination-processes', 'minority-diffusion'],
      },
      {
        number: 2,
        title: 'Continuity equation',
        page: 1,
        demos: ['continuity', 'minority-diffusion', 'drift-diffusion'],
      },
      {
        number: 3,
        title: 'Quasi-Fermi levels',
        page: 2,
        demos: ['quasi-fermi', 'doping-carriers'],
      },
      {
        number: 4,
        title: 'Metal–semiconductor band diagrams',
        page: 3,
        demos: ['schottky', 'schottky-bias', 'capacitance'],
      },
    ],
    annotations: [
      {
        page: 1,
        x: 0.77,
        y: 0.31,
        label: 'Problem 1(a–b): equilibrium and excess',
        text: 'Boron makes the sample p-type, so p₀ ≈ 10¹⁶ cm⁻³ and n₀ = nᵢ²/p₀ ≈ 10⁴ cm⁻³ for nᵢ ≈ 10¹⁰ cm⁻³. In steady illumination, excess minority electrons satisfy Δn = Gτ = (10²⁰ cm⁻³s⁻¹)(10⁻⁶ s) = 10¹⁴ cm⁻³. Pair generation gives Δp = Δn.',
      },
      {
        page: 1,
        x: 0.77,
        y: 0.41,
        label: 'Problem 1(c–d): total densities',
        text: 'Add excess to equilibrium: p = p₀+Δp ≈ 10¹⁶ cm⁻³, while n = n₀+Δn ≈ 10¹⁴ cm⁻³. Their product is about 10³⁰ cm⁻⁶, far above equilibrium nᵢ² ≈ 10²⁰ cm⁻⁶. Mass action np = nᵢ² does not apply to this illuminated nonequilibrium sample.',
      },
      {
        page: 1,
        x: 0.78,
        y: 0.63,
        label: 'Problem 2(a): low-level injection',
        text: 'The boundary excess is γNᴅ with γ = 10⁻⁴, much smaller than majority density Nᴅ. The interior profile cannot exceed the illuminated boundary values under this steady diffusion–recombination model, so low-level injection holds. The supplied solution says 10⁻³Nᴅ in one sentence; that appears inconsistent with the stated γ = 10⁻⁴.',
      },
      {
        page: 1,
        x: 0.78,
        y: 0.76,
        label: 'Problem 2(b): interior equation',
        text: 'No light reaches 0 < x < L, so generation inside is zero. Under steady, field-free, low-level conditions, hole diffusion is balanced by recombination: Dₚ d²Δpₙ/dx² − Δpₙ/τₚ = 0. The second derivative describes spatial spreading; the lifetime term removes excess holes.',
      },
      {
        page: 1,
        x: 0.78,
        y: 0.88,
        label: 'Problem 2(c): two illuminated boundaries',
        text: 'The general solution has both decaying and growing exponentials, A e⁻ˣ/ᴸᵖ + B eˣ/ᴸᵖ, because the bar has two finite illuminated ends. Lₚ = √(Dₚτₚ). Apply Δpₙ(0) = γNᴅ and Δpₙ(L) = γNᴅ to determine A and B. Omitting one exponential would generally fail one of these boundary conditions.',
      },
      {
        page: 2,
        x: 0.77,
        y: 0.19,
        label: 'Problem 2(d): current at the left edge',
        text: 'With negligible electric field, hole current is diffusion current Jₚ = −qDₚ dΔpₙ/dx. Differentiate the two-exponential profile, then evaluate at x = 0 to obtain Jₚ(0) = −qDₚ(B−A)/Lₚ. The sign indicates conventional-current direction; the boundary gradient sets its magnitude.',
      },
      {
        page: 2,
        x: 0.77,
        y: 0.36,
        label: 'Problem 3(a): equilibrium Fermi level',
        text: 'Donors give n₀ ≈ Nᴅ = 10¹⁴ cm⁻³ and p₀ = nᵢ²/n₀ ≈ 10⁶ cm⁻³. The electron concentration relative to nᵢ sets Eꜰ−Eᵢ = kT ln(n₀/nᵢ). With n₀/nᵢ = 10⁴ and kT ≈ 0.026 eV, the level lies about 0.24 eV above Eᵢ.',
      },
      {
        page: 2,
        x: 0.77,
        y: 0.62,
        label: 'Problem 3(b): low-level light injection',
        text: 'Adding 10¹² cm⁻³ pairs hardly changes majority electrons from 10¹⁴ cm⁻³, so Fₙ stays near its equilibrium position, about 0.24 eV above Eᵢ. Holes rise from 10⁶ to about 10¹² cm⁻³, moving Fₚ to about 0.12 eV below Eᵢ. The two quasi-Fermi levels describe one illuminated nonequilibrium state.',
      },
      {
        page: 2,
        x: 0.77,
        y: 0.81,
        label: 'Problem 3(c): high-level injection',
        text: 'At 10¹⁹ cm⁻³ photogenerated pairs, both n and p are approximately 10¹⁹ cm⁻³, much greater than the original doping. The nondegenerate formulas place Fₙ about 0.54 eV above Eᵢ and Fₚ about 0.54 eV below it. Because these levels approach band edges, check whether a full Fermi–Dirac model would improve accuracy.',
      },
      {
        page: 3,
        x: 0.77,
        y: 0.39,
        label: 'Problem 4: barrier versus band bending',
        text: 'NiSi/Si uses measured barriers Φᴮⁿ = 0.65 eV and Φᴮᵖ = 0.47 eV. The bulk Fermi-to-band-edge offset comes from doping, then qVᵦᵢ is barrier height minus that offset. The interface barrier belongs to the material contact; bias changes the semiconductor voltage drop and depletion width rather than changing the assumed barrier height.',
      },
      {
        page: 3,
        x: 0.77,
        y: 0.72,
        label: 'Problem 4(a): unbiased n-type contact',
        text: 'For Nᴅ = 10¹⁷ cm⁻³, E꜀−Eꜰ ≈ 0.15 eV, so Vᵦᵢ ≈ 0.65−0.15 = 0.50 V. Insert εₛ, q, Nᴅ and Vᵦᵢ into W = √[2εₛ(Vᵦᵢ−Vᴀ)/(qNᴅ)] to get W ≈ 0.081 µm. The band diagram shows the corresponding upward bending near the interface.',
      },
      {
        page: 4,
        x: 0.77,
        y: 0.14,
        label: 'Problem 4(b): reverse bias',
        text: 'At Vᴀ = −1 V, the depletion voltage becomes Vᵦᵢ−Vᴀ = 1.5 V, three times its zero-bias value. Width therefore grows by √3, from about 0.081 to 0.14 µm. The interface barrier Φᴮⁿ is held at 0.65 eV; the band bending on the semiconductor side grows.',
      },
      {
        page: 4,
        x: 0.77,
        y: 0.46,
        label: 'Problem 4(c): forward bias',
        text: 'At Vᴀ = +0.2 V, the depletion voltage falls from 0.50 to 0.30 V. Width scales by √(0.30/0.50), giving about 0.063 µm. The lowered semiconductor-side barrier makes majority-carrier flow easier, while the ideal interface barrier height remains the same.',
      },
      {
        page: 4,
        x: 0.77,
        y: 0.76,
        label: 'Problem 4(d): p-type contact',
        text: 'For the p-type sample use the hole barrier Φᴮᵖ = 0.47 eV. The bulk offset Eꜰ−Eᵥ is about 0.135 eV, leaving Vᵦᵢ ≈ 0.335 V. The depletion formula then gives W ≈ 0.066 µm. The band bending and majority carrier are reversed relative to n-type, so label the hole barrier carefully.',
      },
    ],
  },
  {
    id: 'hw3',
    title: 'Homework 3 solutions',
    file: '/homework/hw3-solutions.pdf',
    pages: 6,
    problems: [
      {
        number: 1,
        title: 'Step-junction fields and potential',
        page: 1,
        demos: ['pn-depletion', 'built-in-potential', 'electrostatic-potential'],
      },
      {
        number: 2,
        title: 'PN diode current components',
        page: 2,
        demos: ['minority-charge-storage', 'minority-diffusion', 'ideal-diode'],
      },
      {
        number: 3,
        title: 'Schottky small-signal capacitance',
        page: 3,
        demos: ['schottky', 'capacitance', 'cv-doping-from-data'],
      },
      {
        number: 4,
        title: 'PN diode charge control',
        page: 3,
        demos: ['minority-charge-storage', 'long-base-charge-control', 'einstein-relation'],
      },
      {
        number: 5,
        title: 'Small-signal model and C–V plot',
        page: 5,
        demos: ['small-signal-diode', 'diode-capacitances', 'cv-doping-from-data'],
      },
    ],
    annotations: [
      {
        page: 1,
        x: 0.8,
        y: 0.405,
        label: 'Problem 1(a): built-in voltage',
        text: 'At equilibrium, use Vᵦᵢ = Vₜ ln(NᴀNᴅ/nᵢ²), with Vₜ ≈ 0.026 V at 300 K. The two dopant densities and nᵢ ≈ 10¹⁰ cm⁻³ give about 0.61–0.62 V. The printed formula appears to have nᵢ rather than nᵢ² in its denominator; the numerical result uses the squared intrinsic concentration.',
      },
      {
        page: 1,
        x: 0.8,
        y: 0.477,
        label: 'Problem 1(b): depletion shares',
        text: 'Charge neutrality requires Nᴀxₚ = Nᴅxₙ, so depletion extends farther into the more lightly doped n side. With W ≈ 1.1 × 10⁻⁴ cm and Nᴀ = 2Nᴅ, the widths are xₚ ≈ W/3 ≈ 0.37 µm and xₙ ≈ 2W/3 ≈ 0.73 µm. The overall width follows W² = (2εₛ/q)(1/Nᴀ+1/Nᴅ)Vᵦᵢ.',
      },
      {
        page: 1,
        x: 0.8,
        y: 0.564,
        label: 'Problem 1(c–d): field and potential checks',
        text: 'The junction field points from the positive ionized donors toward the negative ionized acceptors, so E(0) = −qNᴅxₙ/εₛ ≈ −1.1 × 10⁴ V/cm. The printed field expression includes an extra factor of 1/2. If V is defined as zero at the p-side depletion edge, V(0) = qNᴀxₚ²/(2εₛ) ≈ 0.205 V; the printed potential expression uses Nᴅ with xₚ², which is inconsistent with that result.',
      },
      {
        page: 1,
        x: 0.45,
        y: 0.728,
        label: 'Problem 1(e): sketch the three profiles',
        text: 'Space charge is a negative rectangle on the p side and a positive rectangle on the n side; their areas cancel. Integrating charge gives a triangular electric-field profile with its negative peak at the metallurgical junction. Integrating −E gives a potential that rises from the p-side edge to the n-side edge, with a total rise of Vᵦᵢ.',
      },
      {
        page: 2,
        x: 0.84,
        y: 0.384,
        label: 'Problem 2(a): minority edge densities',
        text: 'The law of the junction multiplies each equilibrium minority density by exp(Vᴀ/Vₜ). Here nₚ₀ = nᵢ²/Nᴀ = 10 cm⁻³ and pₙ₀ = nᵢ²/Nᴅ = 100 cm⁻³. At Vᴀ = 0.6 V, the factor is about 9.7 × 10⁹, giving nₚ ≈ 9.7 × 10¹⁰ and pₙ ≈ 9.7 × 10¹¹ cm⁻³. The excess concentrations use exp(Vᴀ/Vₜ) − 1, practically the same at this bias.',
      },
      {
        page: 2,
        x: 0.84,
        y: 0.59,
        label: 'Problem 2(b): Einstein relation and lengths',
        text: 'Convert mobility to diffusion coefficient with D = μVₜ, then multiply by minority lifetime under the square root: Lₙ = √(Dₙτₙ), Lₚ = √(Dₚτₚ). The solution obtains Dₙ ≈ 7.8 and Dₚ ≈ 9.1 cm²/s, with Lₙ ≈ 0.88 µm and Lₚ ≈ 3 µm. Electron and hole lifetimes belong to their respective minority populations, not to the side where that carrier is the majority.',
      },
      {
        page: 2,
        x: 0.84,
        y: 0.791,
        label: 'Problem 2(b): current decays away from each edge',
        text: 'Minority-hole diffusion current in the neutral n region falls as exp[−(x−xₙ)/Lₚ]; minority-electron diffusion current in the neutral p region falls as exp[(x+xₚ)/Lₙ]. Their edge values are about 0.0047 and 0.00138 A/cm². The final electron exponent should use Lₙ; an intermediate line in the supplied solution displays Lₚ. Total terminal current remains constant because the majority-current component picks up what minority current loses to recombination.',
      },
      {
        page: 3,
        x: 0.8,
        y: 0.111,
        label: 'Problem 2(c): equal-current plane',
        text: 'The two edge contributions add to Jₜₒₜ ≈ 0.00608 A/cm². In the n region, the hole component equals the electron component where Jₚ = Jₜₒₜ/2 ≈ 0.00304 A/cm². Solve 0.0047 exp[−(x−xₙ)/Lₚ] = 0.00304 to get (x−xₙ)/Lₚ ≈ 0.436, hence x−xₙ ≈ 1.31 µm. This distance is measured from the n-side depletion edge.',
      },
      {
        page: 3,
        x: 0.84,
        y: 0.29,
        label: 'Problem 3: read the C–V plot',
        text: 'For a one-sided n-type Schottky depletion region, 1/Cⱼ² = 2(Vᵦᵢ−Vᴀ)/(qεₛA²Nᴅ). Extend each straight line to 1/C² = 0 to read its built-in voltage. The magnitude of the negative slope is inversely proportional to donor density when area and permittivity are equal. These two independent graph features answer different parts of the question.',
      },
      {
        page: 3,
        x: 0.84,
        y: 0.59,
        label: 'Problem 3(a): metal work function',
        text: 'Metal 2 extrapolates to a larger built-in voltage, about 1 V versus 0.4 V for Metal 1. In an ideal n-type Schottky contact, Φᴮⁿ = Φᴍ−χ and Vᵦᵢ = Φᴮⁿ−(E꜀−Eꜰ)/q. A larger built-in voltage suggests a larger work function if the semiconductor bulk offsets are comparable. Because the samples have different doping, their E꜀−Eꜰ offsets differ too; the intercept alone does not determine an exact work-function difference.',
      },
      {
        page: 3,
        x: 0.84,
        y: 0.691,
        label: 'Problem 3(b): slope and doping',
        text: 'Metal 1 has the steeper 1/C² line. Since |slope| = 2/(qεₛA²Nᴅ), a steeper line means a smaller donor concentration for equal-area contacts. The metal choice affects the intercept through barrier height, while the n-type dopant density controls the slope in this ideal model.',
      },
      {
        page: 4,
        x: 0.82,
        y: 0.217,
        label: 'Problem 4: read the log concentration plot',
        text: 'The flat majority plateaus give pₚ ≈ Nᴀ = 10¹⁶ and nₙ ≈ Nᴅ = 10¹⁸ cm⁻³. The flat minority values are nₚ₀ = 10⁴ and pₙ₀ = 10² cm⁻³. Edge concentrations rise to 10¹⁴ electrons on the p side and 10¹² holes on the n side. Reading the logarithmic axis first prevents confusing majority levels with minority excess.',
      },
      {
        page: 4,
        x: 0.84,
        y: 0.655,
        label: 'Problem 4(a–c): bias and injection level',
        text: 'Either edge concentration is 10¹⁰ times its equilibrium value, so exp(Vᴀ/Vₜ) = 10¹⁰ and Vᴀ ≈ 0.026 ln(10¹⁰) ≈ 0.6 V. Subtract equilibrium minorities to obtain Δnₚ ≈ 10¹⁴ and Δpₙ ≈ 10¹² cm⁻³. Both are much smaller than their local majority concentrations, so the low-level injection approximation is self-consistent.',
      },
      {
        page: 4,
        x: 0.84,
        y: 0.805,
        label: 'Problem 4(d): mobility sets diffusion length',
        text: 'For the p-side electron minority, the solution reads μₙ ≈ 1200 cm²/(V·s) and uses τₙ = 10⁻⁶ s, giving Dₙ = μₙVₜ ≈ 31.2 cm²/s and Lₙ ≈ 55 µm. For n-side holes, μₚ ≈ 150 cm²/(V·s) and τₚ = 10⁻⁷ s give Dₚ ≈ 3.9 cm²/s and Lₚ ≈ 0.624 µm. The mobility values are graph-based estimates, so the final lengths are approximate.',
      },
      {
        page: 5,
        x: 0.83,
        y: 0.139,
        label: 'Problem 4(e): stored minority charge',
        text: 'For a long neutral region, integrate an exponential excess profile: the stored charge magnitude is qAΔn(edge)Lₙ for electrons or qAΔp(edge)Lₚ for holes. Convert 100 µm² to 10⁻⁶ cm² before multiplying. The result is |Qₙ| ≈ 8.8 × 10⁻¹⁴ C and Qₚ ≈ 1.0 × 10⁻¹⁶ C. Electron charge is negative, so the signed Qₙ should carry a minus sign even though the printed numerical result is positive.',
      },
      {
        page: 5,
        x: 0.83,
        y: 0.226,
        label: 'Problem 4(f): charge-control current',
        text: 'At steady state, recombination replenishment gives each injected current as stored excess-charge magnitude divided by its minority lifetime. Electron injection contributes |Qₙ|/τₙ ≈ 8.8 × 10⁻⁸ A, while hole injection contributes Qₚ/τₚ ≈ 1.0 × 10⁻⁹ A. Adding them gives roughly 8.9 × 10⁻⁸ A; the electron component dominates despite the n side being more heavily doped.',
      },
      {
        page: 5,
        x: 0.84,
        y: 0.498,
        label: 'Problem 5(a): resistance and built-in voltage check',
        text: 'Linearizing the diode around its DC current gives rᵈ ≈ Vₜ/Iᴅᴄ ≈ 0.026/(8.9 × 10⁻⁸) ≈ 2.9 × 10⁵ Ω. For the actual junction dopings, however, Vᵦᵢ = Vₜ ln(NᴀNᴅ/nᵢ²) ≈ 0.84 V using nᵢ = 10¹⁰ cm⁻³, not the printed 0.919 V. The printed formula Eg/(2q)+Vₜ ln(Nᴀ/nᵢ) represents a p-side band-edge-to-Fermi separation under a midgap approximation, rather than the full p-to-n built-in voltage.',
      },
      {
        page: 5,
        x: 0.84,
        y: 0.697,
        label: 'Problem 5(a): two capacitances',
        text: 'Depletion capacitance is Cⱼ = εₛA/W. Correcting Vᵦᵢ to about 0.84 V gives W ≈ 0.18 µm and Cⱼ ≈ 0.06 pF at Vᴀ = 0.6 V. Diffusion capacitance follows the stored minority charge: Cᴅ ≈ (τₙIₙ+τₚIₚ)/Vₜ ≈ 3.4 pF, so it dominates. The supplied calculation writes 10⁻⁶/(2.95 × 10⁵) as 3.9 pF; that quotient is about 3.4 pF.',
      },
      {
        page: 5,
        x: 0.84,
        y: 0.847,
        label: 'Problem 5(a): parallel small-signal model',
        text: 'At a fixed forward-bias operating point, a small AC voltage produces a conductive current through differential resistance rᵈ and a displacement or stored-charge current through capacitance C = Cⱼ+Cᴅ. Those branches are in parallel in the simplified model, with quasi-neutral series resistance neglected as the problem states. The conductance is the local slope of the I–V curve, not the DC ratio I/V.',
      },
      {
        page: 6,
        x: 0.83,
        y: 0.193,
        label: 'Problem 5(b): reverse-bias C–V line',
        text: 'Under reverse bias, forward-injected charge is negligible, so Cᴅ is small and C ≈ Cⱼ. For a one-sided abrupt junction, 1/C² = 2(Vᵦᵢ−Vᴀ)/(qεₛA²Nlight); this is a straight line with negative slope versus Vᴀ. Its x-intercept occurs where the extrapolated inverse-square capacitance reaches zero. Use A² = 10⁻¹² cm⁴ when A = 10⁻⁶ cm²; the supplied solution notes a power-of-ten error in its printed graph scaling.',
      },
      {
        page: 6,
        x: 0.83,
        y: 0.445,
        label: 'Problem 5(b): intercept consistency',
        text: 'The graph is extrapolated from the reverse-bias data; the intercept is the built-in voltage only within the abrupt depletion model. The supplied graph labels 0.919 V, inheriting the earlier built-in-voltage calculation. With Nᴀ = 10¹⁶, Nᴅ = 10¹⁸, nᵢ = 10¹⁰ cm⁻³, and Vₜ = 0.026 V, the consistent junction value is about 0.84 V. The one-sided approximation changes the slope slightly, not that equilibrium logarithm.',
      },
    ],
  },
];
