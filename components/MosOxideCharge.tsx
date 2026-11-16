'use client';

import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, useParams } from './Demos';
import Plot from './Plot';
import { oxideChargeState } from '../lib/mos-lecture-thirteen';

const gateRange: [number, number] = [-2, 3];
const densityUnit = 1e11;

export default function MosOxideCharge() {
  const { v, set, reset } = useParams({
    VG: 0.6,
    tox: 10,
    Nfixed: 1,
    Nmobile: 0,
    ionPosition: 0.8,
    trapStretch: 0,
    implantDose: 0,
  });
  const stateAt = (gateVoltage: number, oxideNm = v.tox, ideal = false) =>
    oxideChargeState({
      gateVoltage,
      oxideNm,
      fixedIons: ideal ? 0 : v.Nfixed * densityUnit,
      mobileIons: ideal ? 0 : v.Nmobile * densityUnit,
      ionPosition: v.ionPosition,
      idealFlatBand: 0,
      acceptors: 1e16,
      trapStretch: ideal ? 0 : v.trapStretch,
      implantIons: ideal ? 0 : v.implantDose * densityUnit,
    });
  const selected = stateAt(v.VG);
  const sweep = Array.from({ length: 121 }, (_, i) => {
    const gate = gateRange[0] + (i * (gateRange[1] - gateRange[0])) / 120;
    return { gate, charged: stateAt(gate), ideal: stateAt(gate, v.tox, true) };
  });
  const thickness = Array.from({ length: 61 }, (_, i) => {
    const nm = 5 + (i * 25) / 60;
    return [nm, stateAt(v.VG, nm).flatBand] as [number, number];
  });
  const flatBandRange = Math.max(0.3, ...thickness.map((point) => Math.abs(point[1]))) * 1.1;
  const surfaceIonX = 195 + v.ionPosition * 260;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'VG',
              label: 'Gate voltage',
              min: gateRange[0],
              max: gateRange[1],
              step: 0.02,
              unit: 'V',
            },
            { key: 'tox', label: 'Oxide thickness', min: 5, max: 30, step: 0.5, unit: 'nm' },
            {
              key: 'Nfixed',
              label: 'Fixed interface charge',
              min: -3,
              max: 3,
              step: 0.1,
              unit: '×10¹¹ cm⁻²',
            },
            {
              key: 'Nmobile',
              label: 'Mobile ion charge',
              min: -3,
              max: 3,
              step: 0.1,
              unit: '×10¹¹ cm⁻²',
            },
            {
              key: 'ionPosition',
              label: 'Ion location: metal → silicon',
              min: 0,
              max: 1,
              step: 0.01,
            },
            { key: 'trapStretch', label: 'Interface-trap stretch', min: 0, max: 1, step: 0.05 },
            {
              key: 'implantDose',
              label: 'Boron threshold implant',
              min: 0,
              max: 3,
              step: 0.1,
              unit: '×10¹¹ cm⁻²',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="MOS nonideal-effect presets">
            <button
              type="button"
              onClick={() => {
                reset();
                set('Nfixed', 2);
              }}
            >
              Fixed positive charge
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                set('Nmobile', 2);
                set('ionPosition', 0.9);
              }}
            >
              Mobile ions near Si
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                set('trapStretch', 0.7);
              }}
            >
              Interface traps
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                set('implantDose', 2);
              }}
            >
              Boron implant
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Which feature moves?"
          forms={[
            {
              label: 'Oxide capacitance per area',
              formula: String.raw`C'_{ox}=\varepsilon_{ox}/t_{ox}`,
            },
            {
              label: 'Flat-band shift from oxide charge',
              formula: String.raw`V_{FB}=\phi_{MS}-\frac{Q_F+fQ_M}{C'_{ox}}`,
            },
            {
              label: 'Approximate boron-implant threshold shift',
              formula: String.raw`\Delta V_T\simeq qN_{impl}/C'_{ox}`,
            },
          ]}
          substitution={String.raw`V_{FB}=${fmt(selected.flatBand, 3)}\,\mathrm V,\quad\Delta V_{T,impl}=${fmt((1.602176634e-19 * v.implantDose * densityUnit) / selected.oxideCapacitance, 3)}\,\mathrm V`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Compare a rigid C–V shift from fixed or mobile oxide charge with the stretched transition
        from interface traps. Move mobile ions toward silicon to increase their influence. A boron
        surface implant shifts threshold more than flat band in this illustrative model.
      </p>
      <Metrics>
        <Metric label="Flat-band voltage" value={fmt(selected.flatBand, 3)} unit="V" />
        <Metric label="Threshold voltage" value={fmt(selected.threshold, 3)} unit="V" />
        <Metric label="Cox′" value={fmt(selected.oxideCapacitance * 1e9, 1)} unit="nF/cm²" />
        <Metric
          label="C′ at selected bias"
          value={fmt(selected.capacitance * 1e9, 1)}
          unit="nF/cm²"
        />
      </Metrics>
      <div className="plot-card">
        <div className="plot-title">
          <b>Where the extra charge sits</b>
          <span>Position changes its gate-voltage effect</span>
        </div>
        <svg
          viewBox="0 0 720 153"
          role="img"
          aria-label="Metal, oxide, and silicon cross section showing fixed interface charge, movable ions, and interface traps"
        >
          <rect x="25" y="37" width="155" height="91" fill="#e2e9f1" rx="6" />
          <rect x="180" y="37" width="290" height="91" fill="#fff0d5" />
          <rect x="470" y="37" width="225" height="91" fill="#edf8f3" rx="6" />
          <text x="103" y="29" textAnchor="middle" fontSize="13" fill="#36506e">
            Metal
          </text>
          <text x="325" y="29" textAnchor="middle" fontSize="13" fill="#8b681e">
            Oxide · {fmt(v.tox, 1)} nm
          </text>
          <text x="582" y="29" textAnchor="middle" fontSize="13" fill="#24734f">
            p-type Si
          </text>
          {v.Nmobile !== 0 && (
            <>
              <circle cx={surfaceIonX} cy="72" r="12" fill="#d99036" />
              <text
                x={surfaceIonX}
                y="77"
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="700"
              >
                {v.Nmobile > 0 ? '+' : '−'}
              </text>
              <text x={surfaceIonX - 25} y="113" fontSize="11" fill="#945d1e">
                mobile ion
              </text>
            </>
          )}
          {v.Nfixed !== 0 && (
            <>
              <circle cx="454" cy="75" r="8" fill="#a84c63" />
              <text x="454" y="79" textAnchor="middle" fill="white" fontSize="11">
                {v.Nfixed > 0 ? '+' : '−'}
              </text>
              <text x="385" y="113" fontSize="11" fill="#9b425b">
                fixed charge
              </text>
            </>
          )}
          {v.trapStretch > 0 && (
            <>
              <path d="M477 54 l8 8 -8 8 -8 -8 Z M477 79 l8 8 -8 8 -8 -8 Z" fill="#7850a4" />
              <text x="485" y="116" fontSize="11" fill="#7850a4">
                interface traps
              </text>
            </>
          )}
          <text x="25" y="145" fontSize="11" fill="#526578">
            f = 0 at metal, f = 1 at silicon · positive charge near Si shifts VFB negative
          </text>
        </svg>
      </div>
      <Plot
        title="High-frequency C–V: shift versus stretch"
        xLabel="Gate voltage VG (V)"
        yLabel="C′ (nF/cm²)"
        xDomain={gateRange}
        yDomain={[0, selected.oxideCapacitance * 1e9 * 1.07]}
        markers={[
          { x: selected.flatBand, label: 'Actual VFB' },
          { x: selected.threshold, label: 'Actual VT' },
        ]}
        series={[
          {
            name: 'Ideal',
            color: '#8797a2',
            dash: true,
            points: sweep.map((s) => [s.gate, s.ideal.capacitance * 1e9]),
          },
          {
            name: 'With selected charge and traps',
            color: '#2672d9',
            points: sweep.map((s) => [s.gate, s.charged.capacitance * 1e9]),
          },
        ]}
      />
      <Plot
        title="Flat-band voltage versus oxide thickness"
        xLabel="Oxide thickness (nm)"
        yLabel="VFB (V)"
        xDomain={[5, 30]}
        yDomain={[-flatBandRange, flatBandRange]}
        markers={[{ x: v.tox, label: 'Selected oxide' }]}
        series={[{ name: 'Fixed charge model', color: '#a75a38', points: thickness }]}
      />
      <p className="carrier-motion-summary">
        The fixed-charge and mobile-ion terms follow the ideal sheet-charge weighting model. Trap
        stretch and implant response are schematic; real extraction depends on trap energy,
        frequency, dopant profile, and interface quality.
      </p>
    </DemoLayout>
  );
}
