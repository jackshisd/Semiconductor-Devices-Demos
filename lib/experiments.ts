const catalog = [
  {
    slug: 'matthiessen-rule',
    title: 'Matthiessen’s rule',
    subtitle: 'Combine phonon and impurity scattering rates and mobility limits',
    group: 'Carrier transport',
  },
  {
    slug: 'screening-effect',
    title: 'Screening effect',
    subtitle: 'See how mobile carriers weaken a dopant ion’s distant electric field',
    group: 'Carrier transport',
  },
  {
    slug: 'thermal-drift',
    title: 'Thermal motion and drift',
    subtitle: 'Compare random carrier motion with directed transport',
    group: 'Carrier transport',
  },
  {
    slug: 'velocity-saturation',
    title: 'Velocity saturation',
    subtitle: 'Watch carrier speeds reach their high-field limits',
    group: 'Carrier transport',
  },
  {
    slug: 'momentum-collisions',
    title: 'Momentum and mean free path',
    subtitle: 'Follow momentum gain, collisions and free-flight distance',
    group: 'Carrier transport',
  },
  {
    slug: 'phonon-scattering',
    title: 'Phonon scattering',
    subtitle: 'Watch vibrating lattice atoms interrupt electron motion',
    group: 'Carrier transport',
  },
  {
    slug: 'impurity-scattering',
    title: 'Ionized impurity scattering',
    subtitle: 'Watch charged dopants bend electron trajectories',
    group: 'Carrier transport',
  },
  {
    slug: 'electron-hole-motion',
    title: 'Electrons and holes carrying current',
    subtitle: 'Compare electron drift with the motion of a missing bond electron',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'band-formation',
    title: 'From atoms to energy bands',
    subtitle: 'Watch discrete electron states build valence and conduction bands',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'electrostatic-potential',
    title: 'Electrostatic potential and carrier drift',
    subtitle: 'Change voltage to tilt the bands and reverse electron and hole motion',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'material-band-comparison',
    title: 'Insulator, silicon, and metal bands',
    subtitle: 'Compare moving carriers across large, small, and zero band gaps',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'carrier-temperature-regions',
    title: 'Carrier concentration vs. temperature',
    subtitle: 'Watch donor freeze-out, the extrinsic plateau, and intrinsic rise',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'doping-carriers',
    title: 'Donors, acceptors & carriers',
    subtitle: 'How doping changes electrons, holes, and charge neutrality',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'thermal-equilibrium',
    title: 'Thermal equilibrium',
    subtitle: 'Sand on a vibrating table: motion continues while the distribution settles',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'boltzmann-approximation',
    title: 'Boltzmann approximation',
    subtitle: 'Compare exact Fermi–Dirac probabilities with the Boltzmann tail',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'intrinsic-carriers',
    title: 'Intrinsic carrier concentration',
    subtitle: 'How temperature changes the intrinsic carrier concentration in silicon',
    group: 'Silicon fundamentals',
  },
  {
    slug: 'doping',
    title: 'Doping profile',
    subtitle: 'Donors, acceptors, and the metallurgical junction',
    group: 'Doping & PN junctions',
  },
  {
    slug: 'pn-depletion',
    title: 'PN depletion',
    subtitle: 'Charge, electric field, and potential',
    group: 'Doping & PN junctions',
  },
  {
    slug: 'built-in-potential',
    title: 'Built-in potential',
    subtitle: 'Doping and equilibrium band bending',
    group: 'Doping & PN junctions',
  },
  {
    slug: 'drift-diffusion',
    title: 'Drift & diffusion',
    subtitle: 'Carrier current and the Einstein relation',
    group: 'Carrier transport',
  },
  {
    slug: 'conductivity-resistivity',
    title: 'Conductivity and resistivity',
    subtitle: 'Combine electron and hole drift contributions to current',
    group: 'Carrier transport',
  },
  {
    slug: 'einstein-relation',
    title: 'Einstein relation',
    subtitle: 'Connect diffusion, mobility, and current balance at equilibrium',
    group: 'Carrier transport',
  },
  {
    slug: 'generation-processes',
    title: 'Carrier generation processes',
    subtitle: 'Step through band-to-band, trap-assisted, and impact generation',
    group: 'Carrier transport',
  },
  {
    slug: 'recombination-processes',
    title: 'Carrier recombination processes',
    subtitle: 'Compare direct, trap-assisted, and Auger recombination',
    group: 'Carrier transport',
  },
  {
    slug: 'direct-indirect-bandgap',
    title: 'Direct and indirect band gaps',
    subtitle: 'See why indirect transitions need a phonon for momentum',
    group: 'Carrier transport',
  },
  {
    slug: 'minority-diffusion',
    title: 'Minority diffusion',
    subtitle: 'Recombination lifetime and diffusion length',
    group: 'Carrier transport',
  },
  {
    slug: 'continuity',
    title: 'Continuity equation',
    subtitle: 'Current divergence and carrier balance',
    group: 'Carrier transport',
  },
  {
    slug: 'ideal-diode',
    title: 'PN diode current',
    subtitle: 'Ideal current, carrier injection, and the qualitative breakdown curve',
    group: 'Doping & PN junctions',
  },
  {
    slug: 'avalanche-breakdown',
    title: 'Avalanche breakdown',
    subtitle: 'Inject an electron and watch impact ionization multiply carriers',
    group: 'Reverse breakdown',
  },
  {
    slug: 'zener-breakdown',
    title: 'Zener breakdown',
    subtitle: 'Explore interband quantum tunneling across a narrow junction',
    group: 'Reverse breakdown',
  },
  {
    slug: 'quasi-fermi',
    title: 'Fermi & quasi-Fermi levels',
    subtitle: 'Doping, injection, and energy levels',
    group: 'Carrier statistics',
  },
  {
    slug: 'hole-distribution',
    title: 'Electron & hole distributions',
    subtitle: 'Density of states × occupation = carrier spectra',
    group: 'Carrier statistics',
  },
  {
    slug: 'degenerate-doping',
    title: 'Degenerate doping',
    subtitle: 'Fermi level and carrier statistics',
    group: 'Carrier statistics',
  },
  {
    slug: 'degenerate-junctions',
    title: 'Degenerate junctions',
    subtitle: 'PN, P⁺N, and N⁺P contacts',
    group: 'Doping & PN junctions',
  },
  {
    slug: 'schottky',
    title: 'Schottky contact',
    subtitle: 'Metal–semiconductor barrier formation',
    group: 'Metal contacts',
  },
  {
    slug: 'schottky-bias',
    title: 'NiSi / Si bias cases',
    subtitle: 'Four contact and bias configurations',
    group: 'Metal contacts',
  },
  {
    slug: 'capacitance',
    title: 'C–V profiling',
    subtitle: 'Doping from depletion capacitance',
    group: 'Metal contacts',
  },
] as const;
const groupOrder: string[] = [
  'Silicon fundamentals',
  'Carrier statistics',
  'Carrier transport',
  'Metal contacts',
  'Doping & PN junctions',
  'Reverse breakdown',
];
const fundamentalOrder: string[] = [
  'intrinsic-carriers',
  'band-formation',
  'electron-hole-motion',
  'electrostatic-potential',
  'material-band-comparison',
  'carrier-temperature-regions',
  'doping-carriers',
  'thermal-equilibrium',
  'boltzmann-approximation',
];
export const experiments = [...catalog].sort(
  (a, b) =>
    groupOrder.indexOf(a.group) - groupOrder.indexOf(b.group) ||
    (a.group === 'Silicon fundamentals'
      ? fundamentalOrder.indexOf(a.slug) - fundamentalOrder.indexOf(b.slug)
      : 0),
);
export type ExperimentSlug = (typeof experiments)[number]['slug'];
