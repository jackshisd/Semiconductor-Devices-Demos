// Shared number formatting for readouts, live TeX substitutions and graph ticks.
// Values with |exponent| <= 2 read more naturally as plain numbers (2.25, 225, 0.0558)
// than as 2.25 × 10⁰; larger or smaller magnitudes keep scientific notation.

const superscriptDigits: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
};

export const superscript = (exponent: number) =>
  String(exponent).replace(/[0-9-]/g, (digit) => superscriptDigits[digit] ?? digit);

const PLAIN_EXPONENT_LIMIT = 2;

/** Split n into a rounded mantissa and exponent, so 9.999 becomes 1 × 10¹ rather than 10 × 10⁰. */
function decompose(n: number, digits: number) {
  const [mantissa, exponent] = n.toExponential(digits).split('e');
  return { mantissa: Number(mantissa), exponent: Number(exponent) };
}

/** Readout format with d digits after the leading digit, e.g. 1.23 × 10¹⁶ or 225. */
export function sci(n: number, d = 2) {
  if (n === 0) return '0';
  if (!Number.isFinite(n)) return String(n);
  const { mantissa, exponent } = decompose(n, d);
  if (Math.abs(exponent) <= PLAIN_EXPONENT_LIMIT) return String(Number(n.toPrecision(d + 1)));
  return `${mantissa} × 10${superscript(exponent)}`;
}

/** TeX version of sci() for live substitutions. */
export function texSci(n: number, d = 2) {
  if (n === 0) return '0';
  if (!Number.isFinite(n)) return String(n);
  const { mantissa, exponent } = decompose(n, d);
  if (Math.abs(exponent) <= PLAIN_EXPONENT_LIMIT) return String(Number(n.toPrecision(d + 1)));
  return `${mantissa}\\times10^{${exponent}}`;
}

/** Compact graph-tick label: plain below 10⁴, otherwise 2×10⁴ or 10⁴ (never 2e+4). */
export function tickLabel(value: number) {
  if (value === 0 || !Number.isFinite(value)) return String(value === 0 ? 0 : value);
  const rounded = Number(value.toPrecision(3));
  if (Math.abs(rounded) < 1e4 && Math.abs(rounded) >= 1e-3) return String(rounded);
  const { mantissa, exponent } = decompose(rounded, 2);
  const power = `10${superscript(exponent)}`;
  if (mantissa === 1) return power;
  if (mantissa === -1) return `−${power}`;
  return `${mantissa}×${power}`;
}
