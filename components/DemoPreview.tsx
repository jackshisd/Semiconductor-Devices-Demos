import type { ExperimentSlug } from '../lib/experiments';

type Kind =
  | 'bands'
  | 'carriers'
  | 'sand'
  | 'probability'
  | 'temperature'
  | 'doping'
  | 'field'
  | 'bending'
  | 'transport'
  | 'decay'
  | 'continuity'
  | 'diode'
  | 'avalanche'
  | 'tunneling'
  | 'fermi'
  | 'spectrum'
  | 'degenerate'
  | 'metal'
  | 'capacitance';
const kinds: Record<ExperimentSlug, Kind> = {
  'matthiessen-rule': 'spectrum',
  'thermal-drift': 'transport',
  'velocity-saturation': 'temperature',
  'momentum-collisions': 'field',
  'phonon-scattering': 'sand',
  'impurity-scattering': 'transport',
  'electron-hole-motion': 'transport',
  'band-formation': 'bands',
  'electrostatic-potential': 'bending',
  'material-band-comparison': 'bands',
  'carrier-temperature-regions': 'temperature',
  'doping-carriers': 'carriers',
  'thermal-equilibrium': 'sand',
  'boltzmann-approximation': 'probability',
  'intrinsic-carriers': 'temperature',
  doping: 'doping',
  'pn-depletion': 'field',
  'built-in-potential': 'bending',
  'drift-diffusion': 'transport',
  'conductivity-resistivity': 'transport',
  'einstein-relation': 'transport',
  'generation-processes': 'carriers',
  'recombination-processes': 'carriers',
  'direct-indirect-bandgap': 'bands',
  'minority-diffusion': 'decay',
  continuity: 'continuity',
  'ideal-diode': 'diode',
  'avalanche-breakdown': 'avalanche',
  'zener-breakdown': 'tunneling',
  'quasi-fermi': 'fermi',
  'hole-distribution': 'spectrum',
  'degenerate-doping': 'degenerate',
  'degenerate-junctions': 'bending',
  schottky: 'metal',
  'schottky-bias': 'metal',
  capacitance: 'capacitance',
};
const blue = '#247da5',
  orange = '#d47748',
  green = '#298474',
  purple = '#8064b2';
const curves: Record<Kind, string[]> = {
  bands: ['M14 14H80 M14 18H80 M14 22H80', 'M14 42H80 M14 46H80 M14 50H80'],
  carriers: ['M15 19H81', 'M15 47H81'],
  sand: ['M13 19V48Q13 53 18 53H78Q83 53 83 48V19', 'M10 57H86'],
  probability: ['M12 14C39 14 37 47 79 47', 'M12 8C29 19 32 47 79 49'],
  temperature: ['M13 49C40 49 47 46 56 35S67 15 80 10'],
  doping: ['M12 12C25 12 36 49 80 49', 'M12 32H82'],
  field: ['M12 20H27L48 53 70 20H83'],
  bending: ['M12 13H27C47 13 48 34 68 34H83', 'M12 30H27C47 30 48 51 68 51H83'],
  transport: ['M15 22H76L69 16 M76 22 69 28', 'M80 43H19L26 37 M19 43 26 49'],
  decay: ['M13 11C25 43 43 50 82 50'],
  continuity: ['M30 17H66V49H30Z', 'M9 33H29L23 27 M29 33 23 39 M67 33H88L82 27 M88 33 82 39'],
  diode: ['M12 39H47C62 39 68 36 72 23L77 9'],
  avalanche: [
    'M12 32H31L52 15H80 M31 32 52 49H80',
    'M52 15 68 7H83 M52 15 68 23H83 M52 49 68 40H83 M52 49 68 57H83',
  ],
  tunneling: ['M12 22H34L59 46H83', 'M12 39H34L59 59H83', 'M16 37Q24 23 32 37T48 37 64 37 80 37'],
  fermi: ['M12 12H83 M12 53H83', 'M12 29H83', 'M12 40H83'],
  spectrum: ['M13 50C32 50 36 11 47 12S57 50 82 50', 'M13 50C34 50 40 28 49 28S62 50 82 50'],
  degenerate: ['M12 20H83 M12 50H83', 'M12 13H83'],
  metal: ['M12 15H29 M34 15C48 15 49 32 65 32H83', 'M34 33C48 33 49 50 65 50H83'],
  capacitance: ['M12 48C30 47 46 43 60 32S74 16 82 8'],
};
export default function DemoPreview({
  slug,
  compact = false,
}: {
  slug: ExperimentSlug;
  compact?: boolean;
}) {
  const kind = kinds[slug];
  return (
    <svg
      className={`demo-preview${compact ? ' demo-preview-compact' : ''}`}
      viewBox="0 0 96 64"
      aria-hidden="true"
    >
      <rect x=".5" y=".5" width="95" height="63" rx="8" fill="#f4f8fa" stroke="#dce8eb" />
      {[
        'probability',
        'temperature',
        'doping',
        'field',
        'decay',
        'diode',
        'spectrum',
        'capacitance',
      ].includes(kind) && <path d="M11 9V54H85" fill="none" stroke="#bfced3" strokeWidth="1" />}
      {kind === 'tunneling' && <rect x="35" y="8" width="23" height="48" fill="#e8e0f1" />}
      {kind === 'metal' && <rect x="12" y="9" width="17" height="46" rx="2" fill="#ced8df" />}
      {kind === 'bands' && <rect x="14" y="27" width="66" height="10" fill="#e7edf0" />}
      {curves[kind].map((d, i) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={[blue, orange, purple][i % 3]}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {kind === 'carriers' && (
        <>
          {[22, 34, 46, 58, 70].map((x) => (
            <circle key={x} cx={x} cy="31" r="3.2" fill={blue} />
          ))}
          {[33, 57].map((x) => (
            <circle key={x} cx={x} cy="40" r="3" fill="white" stroke={orange} strokeWidth="1.8" />
          ))}
        </>
      )}
      {kind === 'sand' &&
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <circle
            key={i}
            cx={20 + ((i * 17) % 58)}
            cy={49 - ((i * 7) % 23)}
            r="2.3"
            fill={i % 3 === 0 ? orange : green}
          />
        ))}
      {kind === 'avalanche' && (
        <>
          <circle cx="18" cy="32" r="3" fill={blue} />
          <circle cx="77" cy="15" r="3" fill={blue} />
          <circle cx="77" cy="49" r="3" fill="white" stroke={orange} strokeWidth="1.8" />
        </>
      )}
      {kind === 'transport' &&
        [25, 42, 59].map((x) => <circle key={x} cx={x} cy="33" r="2.4" fill={green} />)}
    </svg>
  );
}
