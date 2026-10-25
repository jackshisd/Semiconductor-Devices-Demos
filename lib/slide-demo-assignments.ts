import type { ExperimentSlug } from './experiments';

// One-based PDF pages, checked against all eight supplied lecture decks.
// The first page in each group is the destination when its demo is selected.
export const lectureAssociations: Record<string, Partial<Record<ExperimentSlug, number[]>>> = {
  // Introductory recap slides are repeated in Lecture 2; demos live there.
  'lecture-1': {},
  'lecture-2': {
    'intrinsic-carriers': [7, 8, 4],
    'band-formation': [10, 9, 11],
    'electron-hole-motion': [12],
    'electrostatic-potential': [13],
    'material-band-comparison': [16],
    'carrier-temperature-regions': [26],
    'doping-carriers': [17, 18, 19, 21, 22, 23, 24, 25, 27],
    'thermal-equilibrium': [29, 28],
    'boltzmann-approximation': [30, 31, 32],
  },
  'lecture-3': {
    'boltzmann-approximation': [5],
    'hole-distribution': [6, 4, 7, 8, 9],
    'intrinsic-carriers': [10, 11, 12],
    'doping-carriers': [18, 14, 15, 16],
    'degenerate-doping': [17, 20],
    'thermal-drift': [25, 23, 24],
    'drift-diffusion': [26, 27],
    'velocity-saturation': [28],
    'momentum-collisions': [29, 30, 31, 32],
    'matthiessen-rule': [35],
    'conductivity-resistivity': [39],
  },
  'lecture-4': {
    'phonon-scattering': [4],
    'impurity-scattering': [5],
    'matthiessen-rule': [6, 7, 8],
    'drift-diffusion': [18, 9, 10, 16, 17, 19, 20, 21, 24],
    'einstein-relation': [22, 23],
    'generation-processes': [26, 25],
    'recombination-processes': [27],
    'direct-indirect-bandgap': [28],
  },
  'lecture-5': {
    continuity: [12, 11, 13, 14, 16, 20],
    'minority-diffusion': [17, 6, 18, 19],
    'quasi-fermi': [21, 8, 9, 10, 22, 23],
    schottky: [29, 26, 27, 28, 31, 32, 33, 37, 38, 40],
    'schottky-bias': [39, 30],
  },
  'lecture-6': {
    schottky: [4, 5, 6],
    'schottky-bias': [7, 8],
    capacitance: [11, 9, 10],
    doping: [13, 12, 14],
    'built-in-potential': [17],
    'degenerate-junctions': [18, 27],
    'pn-depletion': [20, 15, 16, 19, 21, 22, 23, 24, 25, 26, 28, 29, 30],
  },
  'lecture-7': {
    'ideal-diode': [17, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 18, 19, 20, 21],
    'minority-diffusion': [14, 15],
  },
  'lecture-8': {
    'pn-depletion': [5],
    'avalanche-breakdown': [7, 4, 6, 9, 10, 17],
    'zener-breakdown': [8],
  },
};

export const slideDemoAssignments: Record<string, Partial<Record<number, ExperimentSlug>>> = {};
export const lectureDemos: Record<string, ExperimentSlug[]> = {};
for (const [lecture, associations] of Object.entries(lectureAssociations)) {
  lectureDemos[lecture] = Object.keys(associations) as ExperimentSlug[];
  slideDemoAssignments[lecture] = {};
  for (const [slug, pages] of Object.entries(associations)) {
    for (const page of pages) slideDemoAssignments[lecture][page] = slug as ExperimentSlug;
  }
}

export function demoForSlide(lectureId: string, slide: number): ExperimentSlug | undefined {
  if (!Number.isInteger(slide) || slide < 1) return undefined;
  return slideDemoAssignments[lectureId]?.[slide];
}

export function slideForDemo(lectureId: string, slug: ExperimentSlug): number | undefined {
  return lectureAssociations[lectureId]?.[slug]?.[0];
}
