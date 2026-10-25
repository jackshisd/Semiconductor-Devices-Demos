export type PracticeProblem =
  | {
      kind: 'choice';
      prompt: string;
      options: [string, string, string, string];
      answer: number;
      solution: string;
      applied?: boolean;
    }
  | {
      kind: 'number';
      prompt: string;
      answer: number;
      unit: string;
      solution: string;
      tolerance: number;
      applied?: boolean;
    };

const choice = (
  prompt: string,
  options: [string, string, string, string],
  answer: number,
  solution: string,
): Extract<PracticeProblem, { kind: 'choice' }> => ({
  kind: 'choice',
  prompt,
  options,
  answer,
  solution,
});
const number = (
  prompt: string,
  answer: number,
  unit: string,
  solution: string,
  tolerance = 0.03,
): Extract<PracticeProblem, { kind: 'number' }> => ({
  kind: 'number',
  prompt,
  answer,
  unit,
  solution,
  tolerance,
});

const appliedChoice = (
  prompt: string,
  options: [string, string, string, string],
  answer: number,
  solution: string,
): PracticeProblem => ({ ...choice(prompt, options, answer, solution), applied: true });
const appliedNumber = (
  prompt: string,
  answer: number,
  unit: string,
  solution: string,
  tolerance = 0.03,
): PracticeProblem => ({ ...number(prompt, answer, unit, solution, tolerance), applied: true });

const corePracticeProblems: Record<string, PracticeProblem[]> = {
  'lecture-1': [
    choice(
      'How many nearest neighbors does a silicon atom have in the diamond lattice?',
      ['2', '4', '6', '8'],
      1,
      'Each silicon atom forms four covalent bonds with four nearest neighbors.',
    ),
    choice(
      'What is a hole in the bond picture?',
      [
        'A missing proton',
        'A mobile vacancy left by a valence electron',
        'A donor ion',
        'An electron in the conduction band',
      ],
      1,
      'A hole is an empty valence state. Neighboring electrons fill the vacancy, making it appear to move as positive charge.',
    ),
    choice(
      'In intrinsic silicon at equilibrium, which relation holds?',
      ['n = 0', 'p = 0', 'n = p = nᵢ', 'n = 2p'],
      2,
      'Thermal generation creates electrons and holes in pairs, giving equal equilibrium densities in pure silicon.',
    ),
    number(
      'Intrinsic silicon has nᵢ = 1.0 × 10¹⁰ cm⁻³. How many conduction electrons are in 0.020 cm³?',
      2e8,
      'electrons',
      'Multiply density by volume: N = (1.0 × 10¹⁰ cm⁻³)(0.020 cm³) = 2.0 × 10⁸ electrons.',
    ),
    choice(
      'When a bond electron becomes a conduction electron, what else is created?',
      ['A hole', 'A donor atom', 'A neutron', 'A second conduction electron'],
      0,
      'Removing the electron leaves one empty valence state, or hole. Generation creates an electron–hole pair.',
    ),
    number(
      'A silicon sample has 3.0 × 10⁹ intrinsic electrons in a volume of 0.30 cm³. What is nᵢ?',
      1e10,
      'cm⁻³',
      'Divide the count by volume: nᵢ = 3.0 × 10⁹ / 0.30 = 1.0 × 10¹⁰ cm⁻³.',
    ),
    choice(
      'Why is a filled valence band unable to carry ordinary current by itself?',
      [
        'It has no nearby empty states for electrons to move into',
        'It has zero electrons',
        'Its electrons have no charge',
        'It is outside the crystal',
      ],
      0,
      'Changing electron momentum requires accessible nearby states. A completely filled band has no vacancies for a net response.',
    ),
    number(
      'At one temperature nᵢ = 2.0 × 10¹⁰ cm⁻³. How many electron–hole pairs are present in 0.0050 cm³ of intrinsic material?',
      1e8,
      'pairs',
      'There is one electron and one hole per pair, so pair density is nᵢ. Multiply 2.0 × 10¹⁰ by 0.0050 to get 1.0 × 10⁸ pairs.',
    ),
    choice(
      'A neighboring valence electron hops right to fill a hole. Which way does the hole appear to move?',
      ['Right', 'Left', 'It disappears without leaving another hole', 'Perpendicular to the hop'],
      1,
      'The vacancy moves to the electron’s former site, opposite the electron hop.',
    ),
    number(
      'A 0.010 cm³ intrinsic sample contains 4.0 × 10⁸ mobile carriers total, counting electrons and holes. What is nᵢ?',
      2e10,
      'cm⁻³',
      'Intrinsic material has equal electron and hole counts. Each type contributes half the total, 2.0 × 10⁸; divide by 0.010 cm³ to obtain 2.0 × 10¹⁰ cm⁻³.',
    ),
  ],
  'lecture-2': [
    choice(
      'Where is a conduction electron represented on a simplified band diagram?',
      [
        'An occupied state above E꜀',
        'An empty state below Eᵥ',
        'A donor ion only',
        'The band gap itself',
      ],
      0,
      'A conduction electron occupies an allowed state in the conduction band above its edge E꜀.',
    ),
    choice(
      'After a donor releases its extra electron, the donor ion is:',
      ['Mobile and negative', 'Fixed and positive', 'Mobile and positive', 'Fixed and neutral'],
      1,
      'The electron becomes mobile, while the donor stays on its lattice site with one positive charge.',
    ),
    choice(
      'What is f(Eꜰ) at equilibrium?',
      ['0', '1/4', '1/2', '1'],
      2,
      'The Fermi–Dirac function equals one half at E = Eꜰ at any nonzero temperature.',
    ),
    number(
      'For nondegenerate equilibrium silicon, n = 1.0 × 10¹⁶ cm⁻³ and nᵢ = 1.0 × 10¹⁰ cm⁻³. Find p.',
      1e4,
      'cm⁻³',
      'Use mass action np = nᵢ²: p = (10¹⁰)² / 10¹⁶ = 10⁴ cm⁻³.',
    ),
    choice(
      'Which change most directly causes the Fermi occupation transition to spread over a wider energy interval?',
      [
        'Increasing temperature',
        'Increasing sample width',
        'Turning off all states',
        'Increasing crystal volume only',
      ],
      0,
      'The transition width is set by kT. Increasing T broadens f(E) around the Fermi level.',
    ),
    number(
      'A sample has Nᴅ = 8.0 × 10¹⁵ and Nᴀ = 2.0 × 10¹⁵ cm⁻³. Assuming complete ionization and nᵢ much smaller, estimate majority electron density.',
      6e15,
      'cm⁻³',
      'The net donor density is Nᴅ − Nᴀ = 6.0 × 10¹⁵ cm⁻³. Charge neutrality gives approximately this many majority electrons.',
    ),
    choice(
      'What is the direction of E꜀ bending where electrostatic voltage V increases?',
      [
        'Up because E꜀ = qV',
        'Down because electron energy includes −qV',
        'It cannot bend',
        'It changes only with doping',
      ],
      1,
      'An electron has charge −q, so its potential energy and the band edge decrease when V increases.',
    ),
    number(
      'Using kT = 0.026 eV at 300 K, how far above Eꜰ is a state that is 3kT higher?',
      0.078,
      'eV',
      'Multiply 3 by 0.026 eV to obtain 0.078 eV. Beyond this scale the electron Boltzmann tail is a useful approximation.',
    ),
    choice(
      'At high temperature, what happens to a moderately doped sample?',
      [
        'It always becomes a metal',
        'Intrinsic pair generation can dominate dopant-supplied carriers',
        'All donors become neutral',
        'The band gap becomes infinite',
      ],
      1,
      'The intrinsic population grows strongly with temperature and can exceed the net dopant concentration.',
    ),
    number(
      'If N꜀ = 2.8 × 10¹⁹ cm⁻³ and (E꜀−Eꜰ)/kT = ln(2800), estimate n in the Boltzmann regime.',
      1e16,
      'cm⁻³',
      'n = N꜀ exp[−(E꜀−Eꜰ)/kT] = 2.8 × 10¹⁹ / 2800 = 1.0 × 10¹⁶ cm⁻³.',
    ),
  ],
  'lecture-3': [
    choice(
      'What two factors are multiplied to obtain the electron energy distribution?',
      ['g꜀(E) and f(E)', 'gᵥ(E) and f(E)', 'Mobility and field', 'Lifetime and density'],
      0,
      'The number of occupied conduction states per energy interval is the available-state density g꜀(E) times occupancy f(E).',
    ),
    choice(
      'At low field, the magnitude of drift velocity is:',
      ['μ|E|', 'D/τ', 'nᵢ²/n', 'qE₉'],
      0,
      'Mobility is the proportionality between average drift speed and electric-field magnitude in the low-field regime.',
    ),
    choice(
      'A conduction electron drifts relative to the electric field:',
      ['With it', 'Against it', 'Always upward', 'With no directional bias'],
      1,
      'Its charge is negative, so the field force and average drift velocity point opposite E.',
    ),
    number(
      'Electron mobility is 1200 cm²/(V·s) and |E| = 50 V/cm. Find the low-field drift-speed magnitude.',
      6e4,
      'cm/s',
      'Use |vᴅ| = μ|E| = 1200 × 50 = 6.0 × 10⁴ cm/s.',
    ),
    choice(
      'What physical parameter mainly limits the time over which field-induced momentum accumulates?',
      ['Mean momentum-scattering time', 'Band gap alone', 'Sample volume', 'Intrinsic level'],
      0,
      'Collisions relax directed momentum. Their mean interval τ enters μ = qτ/m*.',
    ),
    number(
      'A carrier has thermal speed 2.0 × 10⁷ cm/s and mean scattering time 1.0 × 10⁻¹³ s. Estimate mean free path.',
      2e-6,
      'cm',
      'ℓ ≈ vₜₕτ = (2.0 × 10⁷)(1.0 × 10⁻¹³) = 2.0 × 10⁻⁶ cm, or 20 nm.',
    ),
    choice(
      'When should the Boltzmann carrier-density approximation be questioned?',
      [
        'When Eꜰ approaches a band edge within a few kT',
        'Whenever temperature is above 0 K',
        'Only when a sample is large',
        'Whenever holes exist',
      ],
      0,
      'Near a band edge, occupancy is no longer a small exponential tail and full Fermi–Dirac statistics may be needed.',
    ),
    number(
      'At 300 K, N꜀ = 2.8 × 10¹⁹ cm⁻³ and n = 2.8 × 10¹⁷ cm⁻³. Using kT = 0.026 eV, find E꜀−Eꜰ in the Boltzmann approximation.',
      0.1197,
      'eV',
      'E꜀−Eꜰ = kT ln(N꜀/n) = 0.026 ln(100) ≈ 0.120 eV.',
    ),
    choice(
      'Why can drift current exist even though thermal speed is much larger than drift speed?',
      [
        'Random velocities nearly cancel, leaving a small directional average',
        'Thermal carriers have no charge',
        'Only one electron moves',
        'Scattering stops all random motion',
      ],
      0,
      'The large random velocity has nearly zero mean; the field adds a small nonzero average to many carriers.',
    ),
    number(
      'A material has q = 1.6 × 10⁻¹⁹ C, τ = 2.0 × 10⁻¹³ s and effective mass 2.6 × 10⁻³¹ kg. Estimate μ in cm²/(V·s).',
      1230.77,
      'cm²/(V·s)',
      'μ = qτ/m* = 0.1231 m²/(V·s). Multiply by 10⁴ to convert to 1.23 × 10³ cm²/(V·s).',
    ),
  ],
  'lecture-4': [
    choice(
      'Which process creates an electron–hole pair using energy from an energetic carrier collision?',
      ['Impact ionization', 'Auger recombination', 'Phonon scattering', 'Diffusion'],
      0,
      'Impact ionization transfers kinetic energy from a fast carrier to excite an additional electron across the gap.',
    ),
    choice(
      'Which scattering mechanism generally becomes stronger as the lattice temperature rises?',
      [
        'Phonon scattering',
        'Ionized impurity scattering only',
        'No scattering',
        'Optical generation',
      ],
      0,
      'Hotter lattice atoms vibrate more strongly, increasing phonon scattering in the course model.',
    ),
    choice(
      'For independent phonon and impurity scattering, which quantities add?',
      ['Mobilities', 'Inverse mobilities', 'Band gaps', 'Fermi levels'],
      1,
      'Matthiessen’s rule adds rates, or inverse mobilities when the effective mass is common.',
    ),
    number(
      'At 300 K, μ = 400 cm²/(V·s). Using kT/q = 0.0259 V, find D.',
      10.36,
      'cm²/s',
      'Einstein relation gives D = μ(kT/q) = 400 × 0.0259 = 10.36 cm²/s.',
    ),
    choice(
      'At equilibrium, what balances diffusion current in a nonuniformly doped sample?',
      [
        'Drift current from an internal field',
        'A permanent external battery',
        'A changing total charge',
        'Nothing; current must flow',
      ],
      0,
      'An internal electric field develops so drift and diffusion cancel, leaving zero net current.',
    ),
    number(
      'If μₚₕ = 1000 and μᵢₘₚ = 500 cm²/(V·s), find total μ from Matthiessen’s rule.',
      333.33,
      'cm²/(V·s)',
      '1/μ = 1/1000 + 1/500 = 0.003, so μ ≈ 333 cm²/(V·s).',
    ),
    choice(
      'Why is silicon inefficient for direct light emission?',
      [
        'Its gap is indirect, so a phonon is usually needed for momentum conservation',
        'It has no valence band',
        'Electrons have no charge',
        'It cannot generate holes',
      ],
      0,
      'Silicon’s conduction minimum and valence maximum occur at different crystal momenta.',
    ),
    number(
      'An electron density rises from 1.0 × 10¹⁶ to 2.0 × 10¹⁶ cm⁻³ over 1.0 µm. Estimate dn/dx in cm⁻⁴.',
      1e20,
      'cm⁻⁴',
      'Δn/Δx = 1.0 × 10¹⁶ cm⁻³ / 10⁻⁴ cm = 1.0 × 10²⁰ cm⁻⁴.',
    ),
    choice(
      'In steady equilibrium, electron drift and diffusion currents are +8 and −8 A/cm². What is total electron current?',
      ['+16 A/cm²', '+8 A/cm²', '0', '−16 A/cm²'],
      2,
      'Add the signed components: +8 + (−8) = 0.',
    ),
    number(
      'For n = 1.0 × 10¹⁶ cm⁻³, μₙ = 1000 cm²/(V·s), E = 20 V/cm and q = 1.6 × 10⁻¹⁹ C, find electron drift current density magnitude.',
      32,
      'A/cm²',
      'Jₙ,drift = qnμₙE = (1.6 × 10⁻¹⁹)(10¹⁶)(1000)(20) = 32 A/cm².',
    ),
  ],
  'lecture-5': [
    choice(
      'What does carrier continuity track?',
      [
        'Carrier accumulation, current flow, generation, and recombination',
        'Only band gap',
        'Only sample geometry',
        'Only Fermi occupancy',
      ],
      0,
      'Continuity is local particle bookkeeping: accumulation equals net inflow plus generation minus recombination.',
    ),
    choice(
      'What does minority-carrier lifetime describe?',
      [
        'Time for excess concentration to decay by a factor e in the simple model',
        'Time for every carrier to cross a sample',
        'A phonon period',
        'The time between momentum collisions',
      ],
      0,
      'An exponential excess population falls to 1/e of its starting value after one lifetime.',
    ),
    choice(
      'At equilibrium, electron and hole quasi-Fermi levels:',
      ['Are always separated by E₉', 'Coincide', 'Are outside the sample', 'Have opposite units'],
      1,
      'A single equilibrium Fermi level describes both carrier populations.',
    ),
    number(
      'A minority excess Δp(0) = 1.0 × 10¹⁴ cm⁻³ decays as e⁻ˣ/ᴸ. What is Δp at x = L?',
      3.6788e13,
      'cm⁻³',
      'At one diffusion length, multiply by e⁻¹: 10¹⁴/e ≈ 3.68 × 10¹³ cm⁻³.',
    ),
    choice(
      'If excess electrons and holes are generated in pairs in a neutral region, what relation often holds?',
      ['Δn = Δp', 'n = p in every doped sample', 'Δn = −Δp', 'Both excess populations must vanish'],
      0,
      'Pair generation adds one electron and one hole, so their excess densities are equal under the stated neutral conditions.',
    ),
    number(
      'For Dₚ = 12 cm²/s and τₚ = 3.0 × 10⁻⁷ s, find Lₚ in µm.',
      19,
      'µm',
      'Lₚ = √(Dₚτₚ) = √(3.6 × 10⁻⁶) cm = 0.001897 cm = 18.97 µm.',
    ),
    choice(
      'In the ideal n-type Schottky model, Φᴮⁿ equals:',
      ['Φᴹ − χ', 'χ − E₉', 'qNᴅW', 'kT/q'],
      0,
      'The ideal electron barrier is metal work function minus semiconductor electron affinity.',
    ),
    number(
      'In a one-dimensional steady region, electron current rises from 2 to 5 A/cm² across 0.10 cm. Estimate dJₙ/dx.',
      30,
      'A/cm³',
      'Finite-difference slope is (5−2)/0.10 = 30 A/cm³. Continuity relates this divergence to local generation and recombination.',
    ),
    choice(
      'Why can a real metal–semiconductor barrier differ from Φᴹ − χ?',
      [
        'Interface states and chemistry alter the energy alignment',
        'Electrons have no charge',
        'The metal has no Fermi level',
        'The semiconductor has no bands',
      ],
      0,
      'Defects and interface bonding can hold charge and partially pin the Fermi level.',
    ),
    number(
      'If Δp(0) = 9.0 × 10¹³ cm⁻³, Dₚ = 10 cm²/s, and Lₚ = 10 µm, find the magnitude of the diffusion particle flux at x = 0.',
      9e17,
      'cm⁻² s⁻¹',
      'For an exponential profile, |dΔp/dx| at the edge is Δp(0)/Lₚ. With Lₚ = 10⁻³ cm, flux magnitude is DₚΔp(0)/Lₚ = 9.0 × 10¹⁷ cm⁻² s⁻¹.',
    ),
  ],
  'lecture-6': [
    choice(
      'Which charges remain in an ideal depletion region?',
      ['Fixed ionized dopants', 'Only free electrons', 'Only free holes', 'Neutral photons'],
      0,
      'The depletion approximation neglects mobile carriers there but retains charged donor and acceptor ions.',
    ),
    choice(
      'Which side of an abrupt pn junction depletes farther?',
      ['More heavily doped side', 'More lightly doped side', 'Always p side', 'Always n side'],
      1,
      'Charge neutrality Nᴀxₚ = Nᴅxₙ means depletion extends farther into the lower-density side.',
    ),
    choice(
      'How does reverse bias affect depletion width?',
      ['It increases', 'It becomes zero', 'It stays fixed', 'It always decreases'],
      0,
      'Reverse bias increases the depletion-region voltage drop and widens the space-charge region.',
    ),
    number(
      'Nᴀ = 2.0 × 10¹⁶ and Nᴅ = 1.0 × 10¹⁶ cm⁻³. If xₙ = 0.30 µm, find xₚ.',
      0.15,
      'µm',
      'Use charge neutrality Nᴀxₚ = Nᴅxₙ. Thus xₚ = (Nᴅ/Nᴀ)xₙ = 0.15 µm.',
    ),
    choice(
      'For a depletion capacitor, which relation is correct?',
      ['C = εₛA/W', 'C = W/(εₛA)', 'C = qE₉', 'C is independent of W'],
      0,
      'Incremental charge is separated across the depletion width, giving C approximately εₛA/W.',
    ),
    number(
      'For εₛ = 1.04 × 10⁻¹² F/cm, area A = 0.010 cm², and W = 1.0 µm, find depletion capacitance.',
      1.04e-10,
      'F',
      'Convert W to 10⁻⁴ cm. C = εₛA/W = (1.04 × 10⁻¹²)(0.010)/(10⁻⁴) = 1.04 × 10⁻¹⁰ F.',
    ),
    choice(
      'What shape is E(x) in a uniformly doped abrupt depletion region?',
      ['Piecewise linear', 'A constant everywhere', 'A sine wave', 'Random noise'],
      0,
      'Uniform fixed charge gives constant dE/dx by Poisson’s equation, so E varies linearly on each side.',
    ),
    number(
      'Using kT/q = 0.0259 V, Nᴀ = Nᴅ = 10¹⁶ cm⁻³, and nᵢ = 10¹⁰ cm⁻³, estimate Vᵦᵢ.',
      0.7156,
      'V',
      'Vᵦᵢ = 0.0259 ln(NᴀNᴅ/nᵢ²) = 0.0259 ln(10¹²) ≈ 0.716 V.',
    ),
    choice(
      'Why does a heavily doped one-sided junction place almost all depletion in the lightly doped side?',
      [
        'The two sides must contain equal-magnitude fixed charge',
        'The heavily doped side has no atoms',
        'Its band gap vanishes',
        'Current cannot cross it',
      ],
      0,
      'Equal charge requires width inversely proportional to dopant density.',
    ),
    number(
      'A triangular junction field has peak magnitude 2.0 × 10⁴ V/cm and total depletion width 1.0 µm. Estimate voltage across depletion.',
      1,
      'V',
      'Voltage is the area under the field triangle: V ≈ EₘₐₓW/2 = (2.0 × 10⁴)(10⁻⁴)/2 = 1.0 V.',
    ),
  ],
  'lecture-7': [
    choice(
      'Forward bias changes the pn-junction barrier how?',
      ['Lowers it', 'Raises it without limit', 'Leaves it unchanged', 'Removes all dopants'],
      0,
      'Forward bias reduces the potential barrier and enables majority carriers to inject across the junction.',
    ),
    choice(
      'After an electron crosses from n side into p side, it becomes:',
      ['A minority carrier', 'A donor ion', 'A hole', 'A photon'],
      0,
      'Electrons are minority carriers in p-type material and diffuse before recombining.',
    ),
    choice(
      'The ideal diode current law is:',
      ['I = I₀(exp(qV/kT) − 1)', 'I = V/I₀', 'I = qnᵢW', 'I = I₀V²'],
      0,
      'The exponential follows the minority-carrier boundary conditions and diffusion profiles.',
    ),
    number(
      'If the ideal diode exponent qV/kT = ln(11), what is I/I₀?',
      10,
      'unitless',
      'Insert the exponent into the ideal law: I/I₀ = exp[ln(11)] − 1 = 11 − 1 = 10.',
    ),
    choice(
      'What sets the spatial decay of injected minority holes in the n-side neutral region?',
      [
        'Hole diffusion length Lₚ',
        'Metal work function only',
        'Photon wavelength only',
        'The sample name',
      ],
      0,
      'The steady profile decays approximately as exp(−x/Lₚ) with Lₚ = √(Dₚτₚ).',
    ),
    number(
      'At one diffusion length from the depletion edge, what fraction of injected minority excess remains?',
      0.36788,
      'fraction',
      'The exponential profile gives exp(−L/L) = e⁻¹ ≈ 0.368.',
    ),
    choice(
      'Under large reverse bias but before breakdown, ideal diode current approaches:',
      ['−I₀', '+I₀', 'Infinite positive current', 'Exactly zero for every diode'],
      0,
      'The exponential term tends to zero, leaving I ≈ −I₀ in the ideal model.',
    ),
    number(
      'If I₀ = 2.0 nA and exp(qV/kT) = 1001, find forward current.',
      2,
      'µA',
      'I = I₀(1001−1) = 2.0 nA × 1000 = 2.0 µA.',
    ),
    choice(
      'If nᵢ doubles while all other ideal saturation-current factors stay fixed, I₀ changes by approximately:',
      ['2×', '4×', '1/2×', 'No change'],
      1,
      'I₀ contains nᵢ², so doubling nᵢ multiplies it by four.',
    ),
    number(
      'For nᵢ = 10¹⁰ and Nᴀ = 10¹⁷ cm⁻³, find equilibrium minority electron density nₚ₀.',
      1e3,
      'cm⁻³',
      'Mass action gives nₚ₀ = nᵢ²/Nᴀ = 10²⁰/10¹⁷ = 10³ cm⁻³.',
    ),
  ],
  'lecture-8': [
    choice(
      'What creates additional electron–hole pairs in avalanche breakdown?',
      [
        'Impact ionization by energetic carriers',
        'A change in atomic number',
        'Only optical absorption',
        'Only Auger recombination',
      ],
      0,
      'Field-accelerated carriers can transfer enough collision energy to create new pairs.',
    ),
    choice(
      'What makes tunneling breakdown likely?',
      [
        'A very narrow depletion barrier from heavy doping',
        'A very wide neutral region',
        'Zero electric field',
        'A missing metal contact',
      ],
      0,
      'Heavy doping narrows the depletion region and permits band-to-band tunneling under reverse field.',
    ),
    choice(
      'At high forward current, a series resistance causes:',
      [
        'An I·R voltage drop outside the ideal junction',
        'The intrinsic concentration to vanish',
        'All carriers to stop',
        'The band gap to double',
      ],
      0,
      'The external voltage includes voltage lost across bulk and contact resistance, bending the measured I–V curve.',
    ),
    number(
      'A diode carries 50 mA through a series resistance of 4.0 Ω. Find the series voltage drop.',
      0.2,
      'V',
      'Use V = IR = 0.050 A × 4.0 Ω = 0.20 V.',
    ),
    choice(
      'Which breakdown mechanism generally has a positive breakdown-voltage temperature coefficient?',
      [
        'Avalanche',
        'Pure tunneling',
        'Neither can depend on temperature',
        'Only optical generation',
      ],
      0,
      'More phonon scattering at higher temperature makes avalanche impact ionization harder, tending to raise breakdown voltage.',
    ),
    number(
      'A triangular depletion field has peak 3.0 × 10⁵ V/cm and width 0.20 µm. Estimate the voltage represented by its area.',
      3,
      'V',
      'V ≈ EₘₐₓW/2. With W = 2.0 × 10⁻⁵ cm, V = (3.0 × 10⁵)(2.0 × 10⁻⁵)/2 = 3.0 V.',
    ),
    choice(
      'Why can depletion-region recombination change the low-forward-bias I–V slope?',
      [
        'It adds a current mechanism with a different voltage dependence',
        'It removes the junction',
        'It makes current independent of voltage',
        'It changes electron charge',
      ],
      0,
      'Trap-assisted recombination in depletion adds current beyond ideal neutral-region minority diffusion.',
    ),
    number(
      'A reverse-biased depletion layer has generation rate 5.0 × 10¹⁷ pairs/(cm³·s), width 2.0 µm, and area 0.010 cm². With q = 1.6 × 10⁻¹⁹ C, estimate generation current magnitude.',
      1.6e-7,
      'A',
      'I ≈ qGAW = (1.6 × 10⁻¹⁹)(5.0 × 10¹⁷)(0.010)(2.0 × 10⁻⁴) = 1.6 × 10⁻⁷ A.',
    ),
    choice(
      'A measured reverse current rises far above ideal −I₀ before breakdown. Which added process is a plausible cause?',
      [
        'Thermal generation in depletion',
        'Complete removal of all defects',
        'Zero carrier density everywhere',
        'An exactly constant depletion width',
      ],
      0,
      'Generated pairs in depletion are separated by the field and add to reverse leakage.',
    ),
    number(
      'A diode’s applied forward voltage is 0.80 V at current 0.10 A with series resistance 2.0 Ω. Estimate voltage across the junction.',
      0.6,
      'V',
      'Subtract the series drop: Vⱼ = Vₐₚₚ − IRₛ = 0.80 − (0.10)(2.0) = 0.60 V.',
    ),
  ],
};

type AppliedSet = {
  easy: PracticeProblem[];
  moderate: PracticeProblem[];
  challenging: PracticeProblem[];
};

const appliedPracticeProblems: Record<string, AppliedSet> = {
  'lecture-1': {
    easy: [
      appliedNumber(
        'A short light pulse creates 4.0 × 10⁸ electron–hole pairs in a 0.020 cm³ intrinsic silicon chip. What excess electron density does the pulse create?',
        2e10,
        'cm⁻³',
        'Every generated pair contributes one excess electron. Divide 4.0 × 10⁸ electrons by 0.020 cm³ to obtain Δn = 2.0 × 10¹⁰ cm⁻³.',
      ),
      appliedChoice(
        'An electrically isolated intrinsic silicon chip absorbs light and creates many electron–hole pairs, with no carriers entering or leaving. What happens to the chip’s net electric charge?',
        [
          'It becomes positive',
          'It becomes negative',
          'It remains neutral',
          'It doubles in magnitude',
        ],
        2,
        'Each promotion creates one negative mobile electron and one positive hole. The charges cancel, so pair generation changes carrier counts but not the chip’s net charge.',
      ),
    ],
    moderate: [
      appliedNumber(
        'An intrinsic sample has nᵢ = 2.0 × 10¹⁰ cm⁻³ and volume 0.10 cm³. Counting the magnitudes of both electron and hole charges, how much mobile charge is present? Use q = 1.6 × 10⁻¹⁹ C.',
        6.4e-10,
        'C',
        'There are nᵢV = 2.0 × 10⁹ electrons and the same number of holes. Add their charge magnitudes: 2(2.0 × 10⁹)(1.6 × 10⁻¹⁹ C) = 6.4 × 10⁻¹⁰ C. The net charge is still zero.',
      ),
    ],
    challenging: [
      appliedNumber(
        'Before a light pulse, an intrinsic region has n = p = 1.0 × 10¹⁰ cm⁻³. The pulse adds 5.0 × 10⁹ electron–hole pairs per cm³. Immediately afterward, what is the total mobile-carrier density n + p?',
        3e10,
        'cm⁻³',
        'Generation raises each population by 5.0 × 10⁹ cm⁻³. Thus n = p = 1.5 × 10¹⁰ cm⁻³ and n + p = 3.0 × 10¹⁰ cm⁻³; do not count a pair as only one mobile carrier.',
      ),
      appliedChoice(
        'In one silicon region, light creates 2.0 × 10⁷ electron–hole pairs while exactly 2.0 × 10⁷ other pairs recombine during the same interval. No carrier crosses the region boundary. What is the net change in its electron and hole counts?',
        [
          'Both rise by 2.0 × 10⁷',
          'Both fall by 2.0 × 10⁷',
          'Neither count changes',
          'Electrons rise while holes fall',
        ],
        2,
        'Generation adds equal numbers of electrons and holes; recombination removes equal numbers. Since the two pair counts are equal, both net changes are zero.',
      ),
    ],
  },
  'lecture-2': {
    easy: [
      appliedNumber(
        'A state in silicon is exactly kT above the Fermi level. Using the Fermi–Dirac occupation function, what fraction of such states are occupied?',
        1 / (1 + Math.E),
        'fraction',
        'Substitute E − E_F = kT into f(E) = 1/[1 + exp((E − E_F)/kT)]. This gives f = 1/(1 + e) ≈ 0.269.',
      ),
      appliedChoice(
        'A compensated silicon sample contains 4.0 × 10¹⁶ donors and 1.0 × 10¹⁶ acceptors per cm³. Assume full ionization and nᵢ is negligible. Which description is consistent with charge neutrality?',
        [
          'It is p-type with 3.0 × 10¹⁶ holes/cm³',
          'It is n-type with about 3.0 × 10¹⁶ electrons/cm³',
          'It has no mobile carriers',
          'It has a net positive charge of 3.0 × 10¹⁶ q/cm³',
        ],
        1,
        'Donors outnumber acceptors by 3.0 × 10¹⁶ cm⁻³, so electrons are the majority carriers at approximately that density. Fixed ion charges and mobile electron charge balance overall.',
      ),
    ],
    moderate: [
      appliedNumber(
        'At 300 K a nondegenerate sample has N꜀ = 2.8 × 10¹⁹ cm⁻³, E꜀ − Eꜰ = 0.120 eV, and kT = 0.026 eV. Estimate its electron density.',
        2.7715e17,
        'cm⁻³',
        'Use n = N꜀ exp[−(E꜀ − Eꜰ)/kT]. The exponent is −0.120/0.026 = −4.615, so n ≈ (2.8 × 10¹⁹)e⁻⁴·⁶¹⁵ = 2.77 × 10¹⁷ cm⁻³.',
      ),
    ],
    challenging: [
      appliedNumber(
        'A silicon sample has Nᴅ = 7.0 × 10¹⁶ cm⁻³, Nᴀ = 2.0 × 10¹⁶ cm⁻³, and nᵢ = 1.0 × 10¹⁰ cm⁻³. Assuming complete ionization, estimate the equilibrium minority hole density.',
        2e3,
        'cm⁻³',
        'First find majority electrons from net doping: n ≈ Nᴅ − Nᴀ = 5.0 × 10¹⁶ cm⁻³. Then use mass action: p = nᵢ²/n = 10²⁰/(5.0 × 10¹⁶) = 2.0 × 10³ cm⁻³.',
      ),
      appliedNumber(
        'Silicon is heated from 300 K to 600 K while E₉ stays at 1.068 eV. Assume N꜀ and Nᵥ each scale as T³ᐟ² and use kᴮ = 8.617 × 10⁻⁵ eV/K. By what factor does nᵢ increase?',
        8.652e4,
        'unitless',
        'Use nᵢ(600)/nᵢ(300) = (600/300)³ᐟ² exp{−E₉/(2kᴮ)[1/600 − 1/300]}. The prefactor is 2.828 and the exponential is about 3.06 × 10⁴, giving 8.65 × 10⁴.',
      ),
    ],
  },
  'lecture-3': {
    easy: [
      appliedChoice(
        'Two silicon samples have the same carrier effective mass. In sample B, carriers travel twice as long on average between collisions as in sample A. In the low-field Drude picture, how do their mobilities compare?',
        [
          'B has half the mobility',
          'B has twice the mobility',
          'They have equal mobility',
          'B has four times the mobility',
        ],
        1,
        'Mobility is μ = qτ/m*. With q and m* fixed, doubling the mean scattering time τ doubles μ; it does not directly double thermal speed.',
      ),
      appliedNumber(
        'A carrier travels at a thermal speed of 3.0 × 10⁷ cm/s and scatters every 4.0 × 10⁻¹³ s on average. Estimate the distance traveled between collisions in centimeters.',
        1.2e-5,
        'cm',
        'Mean free path is ℓ = vₜₕτ = (3.0 × 10⁷ cm/s)(4.0 × 10⁻¹³ s) = 1.2 × 10⁻⁵ cm, or 120 nm.',
      ),
    ],
    moderate: [
      appliedNumber(
        'In a low-field measurement, the electron drift-speed magnitude is 4.5 × 10⁴ cm/s when the applied field magnitude is 75 V/cm. What electron mobility does the measurement imply?',
        600,
        'cm²/(V·s)',
        'Use |vₙ| = μₙ|E|. Dividing 4.5 × 10⁴ cm/s by 75 V/cm gives μₙ = 600 cm²/(V·s).',
      ),
    ],
    challenging: [
      appliedNumber(
        'At one temperature a sample has phonon-limited mobility 1500 and impurity-limited mobility 750 cm²/(V·s). Under an 80 V/cm field, what low-field drift-speed magnitude results when both mechanisms act?',
        4e4,
        'cm/s',
        'Matthiessen’s rule gives 1/μ = 1/1500 + 1/750, hence μ = 500 cm²/(V·s). Then |v| = μ|E| = 500 × 80 = 4.0 × 10⁴ cm/s.',
      ),
      appliedChoice(
        'A measured electron drift speed grows almost linearly at weak field, but raising a strong field from 50 to 100 kV/cm changes the speed only slightly. Which inference best fits the observation?',
        [
          'The electron has become neutral',
          'Velocity saturation limits further speed growth',
          'The electric field has reversed',
          'The thermal speed must be zero',
        ],
        1,
        'Low-field drift follows |v| ≈ μ|E|. At strong fields, increased energy loss and scattering make the drift velocity approach a saturation value, so doubling field gives much less than double speed.',
      ),
    ],
  },
  'lecture-4': {
    easy: [
      appliedChoice(
        'Two materials have similar gaps. In material A an electron can recombine with a hole without changing crystal momentum; in material B a phonon is needed. Which material should emit light more efficiently?',
        [
          'Material A, the direct-gap material',
          'Material B, the indirect-gap material',
          'Both equally, because the gaps match',
          'Neither can emit a photon',
        ],
        0,
        'A direct-gap transition can conserve momentum while emitting a photon. Requiring an additional phonon makes radiative recombination less likely in an indirect-gap material.',
      ),
      appliedChoice(
        'Electron density rises toward +x across a silicon bar and the electric field is zero. Which way does the conventional electron diffusion current point?',
        [
          'Toward +x',
          'Toward −x',
          'There is no diffusion current',
          'It alternates direction in time',
        ],
        0,
        'The diffusion term is Jₙ,diff = qDₙ dn/dx. Since dn/dx is positive, conventional electron current points toward +x even though electrons themselves diffuse toward −x.',
      ),
    ],
    moderate: [
      appliedNumber(
        'In one region n = 1.0 × 10¹⁶ cm⁻³, μₙ = 1000 cm²/(V·s), E = +10 V/cm, Dₙ = 26 cm²/s, and dn/dx = +1.0 × 10¹⁸ cm⁻⁴. Using q = 1.6 × 10⁻¹⁹ C, find total electron current density.',
        20.16,
        'A/cm²',
        'Add electron drift and diffusion: qnμₙE = 16 A/cm² and qDₙ(dn/dx) = 4.16 A/cm². Both point toward +x, giving Jₙ = 20.16 A/cm².',
      ),
    ],
    challenging: [
      appliedNumber(
        'At equilibrium an electron density is n = 1.0 × 10¹⁶ cm⁻³ with gradient dn/dx = +2.0 × 10¹⁹ cm⁻⁴. At 300 K take Vᴛ = 0.026 V. What signed electric field cancels electron diffusion current?',
        -52,
        'V/cm',
        'Set Jₙ = qnμₙE + qDₙ dn/dx = 0, then use Dₙ/μₙ = Vᴛ. Thus E = −(Vᴛ/n)(dn/dx) = −0.026(2.0 × 10¹⁹/10¹⁶) = −52 V/cm.',
      ),
      appliedChoice(
        'A moderately doped sample warms through a temperature range where ionized-impurity and phonon scattering are both important. Why can its total mobility have a maximum rather than change monotonically?',
        [
          'Both scattering mechanisms vanish at the same temperature',
          'Impurity-limited mobility can rise while phonon-limited mobility falls',
          'Carrier charge reverses at the maximum',
          'Matthiessen’s rule makes mobilities add directly',
        ],
        1,
        'Hotter carriers are less strongly deflected by fixed impurity ions, while phonon scattering grows with temperature. Their inverse-mobility contributions compete, so the total can peak.',
      ),
    ],
  },
  'lecture-5': {
    easy: [
      appliedNumber(
        'A p-type silicon wafer has Nᴀ = 1.0 × 10¹⁶ cm⁻³. Uniform light generates 1.0 × 10¹⁹ pairs/(cm³·s), and the minority-electron lifetime is 2.0 µs. In steady low-level injection, estimate excess electron density.',
        2e13,
        'cm⁻³',
        'With negligible transport in the uniformly lit region, steady excess minority density is Δn = Gᴸτₙ = (1.0 × 10¹⁹)(2.0 × 10⁻⁶) = 2.0 × 10¹³ cm⁻³. This is much less than majority p₀ ≈ 10¹⁶ cm⁻³.',
      ),
      appliedChoice(
        'Both ends of an n-type bar are illuminated, but the light does not reach its interior. Conditions are steady and the interior field is negligible. Which equation should determine excess minority holes inside?',
        [
          'Dₚ d²Δp/dx² − Δp/τₚ = 0',
          'Δp = Gᴸτₚ everywhere inside',
          'dΔp/dx = 0 everywhere',
          'Jₚ = qpμₚE only',
        ],
        0,
        'The interior has no optical generation and little drift. Steady continuity leaves diffusion balanced by recombination: Dₚ d²Δp/dx² − Δp/τₚ = 0, with illuminated-end boundary conditions.',
      ),
    ],
    moderate: [
      appliedNumber(
        'A uniformly illuminated p-type region reaches steady excess minority-electron density Δn = 5.0 × 10¹³ cm⁻³ under generation rate Gᴸ = 2.5 × 10¹⁹ pairs/(cm³·s). If transport is negligible, infer the minority lifetime in seconds.',
        2e-6,
        's',
        'Steady low-injection continuity gives Δn = Gᴸτₙ. Divide 5.0 × 10¹³ by 2.5 × 10¹⁹ to obtain τₙ = 2.0 × 10⁻⁶ s.',
      ),
    ],
    challenging: [
      appliedNumber(
        'An n-type wafer has nᵢ = 1.0 × 10¹⁰ cm⁻³. Illumination makes its hole density p ≈ 1.0 × 10¹² cm⁻³. At 300 K, kT = 0.026 eV. How far below Eᵢ is the hole quasi-Fermi level Fₚ?',
        0.11973,
        'eV',
        'Use Eᵢ − Fₚ = kT ln(p/nᵢ). The ratio is 100, so the separation is 0.026 ln(100) = 0.1197 eV. A larger hole density moves Fₚ farther below Eᵢ.',
      ),
      appliedNumber(
        'An n-type bar has Nᴅ = 1.0 × 10¹⁷ cm⁻³ and equal illuminated ends imposing Δp(0) = Δp(L) = γNᴅ with γ = 10⁻⁴. If L = 20 µm, Lₚ = 10 µm, Dₚ = 10 cm²/s, q = 1.6 × 10⁻¹⁹ C, and tanh(1) = 0.762, estimate the hole current density at x = 0.',
        0.01219,
        'A/cm²',
        'For equal end injection, Jₚ(0) = qDₚγNᴅ tanh[L/(2Lₚ)]/Lₚ. Here γNᴅ = 10¹³ cm⁻³, Lₚ = 10⁻³ cm and L/(2Lₚ) = 1. Substitution gives +0.0122 A/cm² into the bar.',
      ),
    ],
  },
  'lecture-6': {
    easy: [
      appliedChoice(
        'A pn junction is reverse biased while its area and temperature stay fixed. A capacitance meter probes the depletion region. Which paired change should it see?',
        [
          'Width rises and capacitance falls',
          'Width falls and capacitance rises',
          'Both width and capacitance rise',
          'Neither changes',
        ],
        0,
        'Reverse bias increases the voltage dropped across depletion and therefore widens W. Since C = εₛA/W, the depletion capacitance decreases.',
      ),
      appliedNumber(
        'A depletion capacitor has εₛ = 1.0 × 10⁻¹² F/cm, area 0.010 cm², and measured C = 1.0 × 10⁻¹⁰ F. What depletion width does C = εₛA/W imply in micrometers?',
        1,
        'µm',
        'Rearrange to W = εₛA/C = (1.0 × 10⁻¹²)(0.010)/(1.0 × 10⁻¹⁰) = 1.0 × 10⁻⁴ cm = 1.0 µm.',
      ),
    ],
    moderate: [
      appliedNumber(
        'For a one-sided silicon junction use εₛ = 1.0 × 10⁻¹² F/cm, q = 1.6 × 10⁻¹⁹ C, lightly doped density N = 1.0 × 10¹⁶ cm⁻³, and depletion voltage U = 0.80 V. Estimate W in micrometers.',
        0.31623,
        'µm',
        'Use W ≈ sqrt[2εₛU/(qN)]. The quantity under the root is 1.0 × 10⁻⁹ cm²; W = 3.16 × 10⁻⁵ cm = 0.316 µm.',
      ),
    ],
    challenging: [
      appliedNumber(
        'In an abrupt junction, the depleted p-side has Nᴀ = 1.0 × 10¹⁷ cm⁻³, xₚ = 0.020 µm and area A = 0.010 cm². With q = 1.6 × 10⁻¹⁹ C, find the magnitude of fixed charge on that side.',
        3.2e-10,
        'C',
        'Use |Q| = qANᴀxₚ. Convert 0.020 µm to 2.0 × 10⁻⁶ cm, then multiply (1.6 × 10⁻¹⁹)(0.010)(1.0 × 10¹⁷)(2.0 × 10⁻⁶) = 3.2 × 10⁻¹⁰ C.',
      ),
      appliedNumber(
        'A one-sided junction has C–V slope m = d(1/C²)/dVᴀ = −1.25 × 10¹⁹ F⁻²/V. Given q = 1.6 × 10⁻¹⁹ C, εₛ = 1.0 × 10⁻¹² F/cm, and area A = 0.010 cm², find the lightly doped density.',
        1e16,
        'cm⁻³',
        'For this voltage convention m = −2/(qεₛA²N). Rearranging gives N = −2/(qεₛA²m). Substituting the negative slope yields 1.0 × 10¹⁶ cm⁻³.',
      ),
    ],
  },
  'lecture-7': {
    easy: [
      appliedChoice(
        'A pn diode is forward biased. Electrons cross from its n side into the p-side neutral region, while holes cross the other way. Which description of the injected carriers is correct?',
        [
          'Both are minority carriers in the regions they enter',
          'Both remain majority carriers after crossing',
          'Only the electrons carry charge',
          'They stop at the depletion edge',
        ],
        0,
        'Electrons entering p-type material and holes entering n-type material are minority carriers there. Their injected excess decays through diffusion and recombination away from the junction.',
      ),
      appliedNumber(
        'An n-side neutral region has Nᴅ = 1.0 × 10¹⁶ cm⁻³ and nᵢ = 1.0 × 10¹⁰ cm⁻³. Forward bias makes exp(Vᴀ/Vᴛ) = 10. Find the hole density pₙ right at the depletion edge.',
        1e5,
        'cm⁻³',
        'First pₙ₀ = nᵢ²/Nᴅ = 10⁴ cm⁻³. The ideal junction boundary condition gives pₙ(edge) = pₙ₀ exp(Vᴀ/Vᴛ) = 10⁴ × 10 = 1.0 × 10⁵ cm⁻³.',
      ),
    ],
    moderate: [
      appliedNumber(
        'A diode has saturation current I₀ = 1.0 nA. At one forward voltage, exp(Vᴀ/Vᴛ) = 101. What current does the ideal diode law predict in nanoamperes?',
        100,
        'nA',
        'Use I = I₀[exp(Vᴀ/Vᴛ) − 1]. The bracket is 101 − 1 = 100, so I = 100 nA. Retaining the −1 matters when the exponential is not enormous.',
      ),
    ],
    challenging: [
      appliedNumber(
        'For a long pn diode, take nᵢ = 1.0 × 10¹⁰ cm⁻³, Nᴀ = Nᴅ = 1.0 × 10¹⁶ cm⁻³, Dₙ = 20 and Dₚ = 10 cm²/s, Lₙ = 0.0020 and Lₚ = 0.0010 cm, area A = 0.010 cm², and q = 1.6 × 10⁻¹⁹ C. Find saturation current I₀.',
        3.2e-13,
        'A',
        'Compute J₀ = qnᵢ²[Dₙ/(LₙNᴀ) + Dₚ/(LₚNᴅ)]. Each bracket term is 1.0 × 10⁻¹² cm⁴/s, giving J₀ = 3.2 × 10⁻¹¹ A/cm². Multiply by 0.010 cm² for I₀ = 3.2 × 10⁻¹³ A.',
      ),
      appliedNumber(
        'Injected minority holes at the n-side depletion edge have excess Δp(0) = 1.0 × 10¹⁴ cm⁻³. With Dₚ = 10 cm²/s, Lₚ = 10 µm and q = 1.6 × 10⁻¹⁹ C, find hole diffusion current density one diffusion length into the neutral region.',
        0.05886,
        'A/cm²',
        'For Δp(x) = Δp(0)e⁻ˣ/ᴸ, Jₚ(x) = qDₚΔp(0)e⁻ˣ/ᴸ/Lₚ. Convert Lₚ = 10⁻³ cm and set x = Lₚ; the result is (1.6 × 10⁻¹⁹)(10)(10¹⁴)e⁻¹/(10⁻³) = 0.0589 A/cm².',
      ),
    ],
  },
  'lecture-8': {
    easy: [
      appliedChoice(
        'Two otherwise similar reverse-biased diodes differ mainly in trap density inside the depletion region. Diode B has many more active traps. Which observation is most plausible before breakdown?',
        [
          'B has more generation leakage',
          'B has no reverse current',
          'B becomes a metal',
          'Both must have exactly the ideal −I₀ current',
        ],
        0,
        'Depletion-region traps can generate electron–hole pairs that the field sweeps apart. More active traps generally increase reverse generation current above ideal minority-diffusion leakage.',
      ),
      appliedNumber(
        'A diode terminal is held at 0.80 V while 20 mA flows through an internal series resistance of 5.0 Ω. Estimate the voltage across the junction itself.',
        0.7,
        'V',
        'The series drop is IRₛ = (0.020 A)(5.0 Ω) = 0.10 V. Subtract it from the terminal voltage: Vⱼ = 0.80 − 0.10 = 0.70 V.',
      ),
    ],
    moderate: [
      appliedNumber(
        'For reverse depletion generation, use Iᴿᴳ ≈ qAnᵢW/(2τ₀). Take q = 1.6 × 10⁻¹⁹ C, area A = 0.010 cm², nᵢ = 1.0 × 10¹⁰ cm⁻³, W = 2.0 µm and τ₀ = 1.0 µs. Find the current magnitude.',
        1.6e-9,
        'A',
        'Convert W = 2.0 × 10⁻⁴ cm and τ₀ = 1.0 × 10⁻⁶ s. Then qAnᵢW/(2τ₀) = (1.6 × 10⁻¹⁹)(0.010)(10¹⁰)(2.0 × 10⁻⁴)/(2.0 × 10⁻⁶) = 1.6 × 10⁻⁹ A.',
      ),
    ],
    challenging: [
      appliedNumber(
        'Estimate breakdown voltage for a one-sided junction using εₛ = 1.0 × 10⁻¹² F/cm, critical field Eᴄʀ = 3.0 × 10⁵ V/cm, lightly doped density N = 1.0 × 10¹⁶ cm⁻³, q = 1.6 × 10⁻¹⁹ C and Vᵦᵢ = 0.70 V.',
        27.425,
        'V',
        'Use Vᴮᴿ ≈ εₛEᴄʀ²/(2qN) − Vᵦᵢ. The field term is (1.0 × 10⁻¹²)(3.0 × 10⁵)²/[2(1.6 × 10⁻¹⁹)(10¹⁶)] = 28.125 V. Subtract 0.70 V to obtain 27.425 V.',
      ),
      appliedChoice(
        'A very heavily doped junction has an extremely narrow depletion region. Its measured breakdown voltage falls as temperature rises. Which mechanism best explains the observation?',
        [
          'Zener tunneling',
          'Avalanche impact ionization',
          'Ordinary ideal reverse saturation',
          'Series resistance alone',
        ],
        0,
        'Heavy doping narrows the barrier enough for tunneling, and Zener-dominated breakdown commonly has a negative temperature coefficient. Avalanche breakdown generally shows the opposite trend.',
      ),
    ],
  },
};

export const practiceProblems: Record<string, PracticeProblem[]> = Object.fromEntries(
  Object.entries(corePracticeProblems).map(([lecture, core]) => {
    const applied = appliedPracticeProblems[lecture];
    return [
      lecture,
      [
        ...core.slice(0, 3),
        ...applied.easy,
        ...core.slice(3, 7),
        ...applied.moderate,
        ...core.slice(7),
        ...applied.challenging,
      ],
    ];
  }),
);

export function problemDifficulty(index: number): 'Easy' | 'Moderate' | 'Challenging' {
  return index < 5 ? 'Easy' : index < 10 ? 'Moderate' : 'Challenging';
}

export function practiceAnswerFormat(
  problem: PracticeProblem,
): 'choice' | 'scientific' | 'fraction' | 'decimal' {
  if (problem.kind === 'choice') return 'choice';
  if (problem.unit === 'fraction') return 'fraction';
  const magnitude = Math.abs(problem.answer);
  return magnitude >= 1e4 || (magnitude > 0 && magnitude < 1e-3) ? 'scientific' : 'decimal';
}

export function parsePracticeNumber(response: string): number | null {
  const value = response.trim().replace(/,/g, '');
  const coefficient = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const multiplied = value.match(
    new RegExp(`^(${coefficient})\\s*[*×]\\s*10\\s*\\^\\s*([+-]?\\d+)$`),
  );
  const number = multiplied
    ? Number(multiplied[1]) * 10 ** Number(multiplied[2])
    : new RegExp(`^${coefficient}(?:[eE][+-]?\\d+)?$`).test(value)
      ? Number(value)
      : NaN;
  return Number.isFinite(number) ? number : null;
}

export function isPracticeResponseComplete(problem: PracticeProblem, response: string): boolean {
  if (problem.kind === 'choice') return /^[0-3]$/.test(response);
  return parsePracticeNumber(response) !== null;
}

export function isPracticeAnswerCorrect(problem: PracticeProblem, response: string): boolean {
  if (!isPracticeResponseComplete(problem, response)) return false;
  if (problem.kind === 'choice') return Number(response) === problem.answer;
  const value = parsePracticeNumber(response)!;
  return (
    Math.abs(value - problem.answer) <=
    Math.max(Math.abs(problem.answer) * problem.tolerance, 1e-12)
  );
}
