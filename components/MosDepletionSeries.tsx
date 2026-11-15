'use client';

import { fmt, sci } from './Demos';
import { mosSeriesCapacitances } from '../lib/mos-charge-cv';

type Props = {
  oxideCapacitance: number;
  depletionWidth: number;
  measuredCapacitance: number;
  gateVoltage: number;
  flatBand: number;
  threshold: number;
  minorityResponse: number;
};

export default function MosDepletionSeries({
  oxideCapacitance,
  depletionWidth,
  measuredCapacitance,
  gateVoltage,
  flatBand,
  threshold,
  minorityResponse,
}: Props) {
  const { depletionCapacitance, seriesCapacitance } = mosSeriesCapacitances(
    oxideCapacitance,
    depletionWidth,
  );
  const flat = Math.abs(gateVoltage - flatBand) < 0.02;
  const accumulation = gateVoltage < flatBand - 0.02;
  const inversion = gateVoltage >= threshold;
  const explanation = flat
    ? 'At flat band, screening extends a finite distance into silicon. The W = 0 depletion approximation is a limit; the measured flat-band capacitance is below Cox.'
    : accumulation
      ? 'Holes pile up directly at the silicon surface. There is no depleted gap, so the oxide dominates the charge separation.'
      : inversion && minorityResponse > 0.2
        ? 'The inversion electrons follow this slow AC probe at the surface. They largely bypass the depleted region, so measured C rises above the series value.'
        : 'The positive gate pushes mobile holes away. Fixed negative acceptors remain over width W. Incremental charge is effectively separated across both oxide and depleted silicon, so C falls.';
  const bar = (label: string, value: number, color: string) => (
    <div className="mos-series-row" key={label}>
      <span>{label}</span>
      <div className="mos-series-track">
        <div
          style={{
            width: `${Math.min(100, (value / oxideCapacitance) * 100)}%`,
            background: color,
          }}
        />
      </div>
      <strong>{Number.isFinite(value) ? sci(value * 1e9) : '∞'} nF/cm²</strong>
    </div>
  );
  return (
    <section className="mos-series" aria-label="Oxide and depletion capacitances in series">
      <h2>Why depletion lowers the overall capacitance</h2>
      <p>{explanation}</p>
      <div
        className="mos-series-chain"
        aria-label="Oxide and depletion capacitors connected in series"
      >
        <span>gate</span>
        <b>→</b>
        <span>oxide · Cₒₓ′</span>
        <b>→</b>
        <span>depleted Si · Cdep′</span>
        <b>→</b>
        <span>mobile holes</span>
      </div>
      <div className="mos-series-equations">
        <span>Cdep′ ≈ εSi / W</span>
        <span>1 / Cseries′ ≈ 1 / Cₒₓ′ + 1 / Cdep′</span>
      </div>
      <div className="mos-series-bars">
        {bar('Oxide Cₒₓ′', oxideCapacitance, '#d18a23')}
        {bar('Depletion Cdep′', depletionCapacitance, '#2672d9')}
        {bar('Series Cseries′', seriesCapacitance, '#14875f')}
        {bar('Measured C′', measuredCapacitance, '#d56138')}
      </div>
      <p className="mos-series-footnote">
        W = {fmt(depletionWidth * 1e7, 1)} nm. Bars use Cₒₓ′ as their full scale; values above Cₒₓ′
        are capped visually. The series formula is the depletion approximation. At low-frequency
        inversion, responding electrons change the measured branch.
      </p>
    </section>
  );
}
