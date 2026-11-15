'use client';

import { useMemo } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, useParams } from './Demos';
import Plot from './Plot';
import { mosSurfaceWidth } from '../lib/mos-surface-width';

const gateRange: [number, number] = [-1.5, 2.5];
const clampGate = (value: number) => Math.max(gateRange[0], Math.min(gateRange[1], value));

export default function MosSurfaceWidth() {
  const { v, set, reset } = useParams({ VG: 0.45, NA: 1e16, tox: 10, VFB: 0 });
  const params = useMemo(
    () => ({ acceptors: v.NA, oxideNm: v.tox, flatBand: v.VFB }),
    [v.NA, v.tox, v.VFB],
  );
  const selected = mosSurfaceWidth(v.VG, params);
  const sweep = useMemo(
    () =>
      Array.from({ length: 161 }, (_, i) => {
        const voltage = gateRange[0] + (i * (gateRange[1] - gateRange[0])) / 160;
        return { voltage, ...mosSurfaceWidth(voltage, params) };
      }),
    [params],
  );
  const markers = [
    { x: v.VFB, label: 'Flat band' },
    { x: selected.thresholdVoltage, label: 'Threshold' },
    { x: v.VG, label: 'Selected gate' },
  ];
  const region =
    selected.regime === 'accumulation'
      ? 'Accumulation: holes crowd the silicon surface; the depletion width is zero.'
      : selected.regime === 'depletion'
        ? 'Depletion: holes leave the surface, so both surface potential and depletion width grow.'
        : 'Inversion: electrons gather at the surface; most extra gate voltage increases inversion charge.';
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
              step: 0.01,
              unit: 'V',
            },
            {
              key: 'NA',
              label: 'P-type acceptor density',
              min: 1e15,
              max: 1e17,
              step: 1e14,
              log: true,
              unit: 'cm⁻³',
            },
            { key: 'tox', label: 'Oxide thickness', min: 5, max: 20, step: 0.5, unit: 'nm' },
            { key: 'VFB', label: 'Flat-band voltage', min: -0.5, max: 0.5, step: 0.01, unit: 'V' },
          ]}
        >
          <div className="chips" role="group" aria-label="MOS bias presets">
            <button type="button" onClick={() => set('VG', clampGate(v.VFB - 0.5))}>
              Accumulation
            </button>
            <button type="button" onClick={() => set('VG', clampGate(v.VFB))}>
              Flat band
            </button>
            <button
              type="button"
              onClick={() => set('VG', clampGate((v.VFB + selected.thresholdVoltage) / 2))}
            >
              Depletion
            </button>
            <button
              type="button"
              onClick={() => set('VG', clampGate(selected.thresholdVoltage + 0.4))}
            >
              Inversion
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Lecture 12 depletion approximation"
          forms={[
            {
              label: 'Surface potential during depletion',
              formula: String.raw`\phi_s=\frac{qN_A\varepsilon_{Si}}{2C_{ox}'^{\,2}}\left[\sqrt{1+\frac{2C_{ox}'^{\,2}(V_G-V_{FB})}{qN_A\varepsilon_{Si}}}-1\right]^2`,
            },
            {
              label: 'Depletion width during depletion',
              formula: String.raw`W=\sqrt{\frac{2\varepsilon_{Si}\phi_s}{qN_A}},\qquad C_{ox}'=\frac{\varepsilon_{ox}}{t_{ox}}`,
            },
            {
              label: 'At threshold',
              formula: String.raw`\phi_s\approx2\phi_F,\qquad W_T=\sqrt{\frac{2\varepsilon_{Si}(2\phi_F)}{qN_A}}`,
            },
          ]}
          substitution={String.raw`\phi_s=${fmt(selected.surfacePotential, 3)}\,\mathrm{V},\quad W=${fmt(selected.depletionWidth * 1e7, 1)}\,\mathrm{nm}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Move the gate voltage across flat band and threshold. The marker tracks the surface
        potential and depletion width on both plots. Change doping or oxide thickness to see how the
        threshold and the width shift.
      </p>
      <p className="capacitance-dominance" role="status">
        {region}
      </p>
      <Metrics>
        <Metric label="Surface potential φₛ" value={fmt(selected.surfacePotential, 3)} unit="V" />
        <Metric label="Depletion width W" value={fmt(selected.depletionWidth * 1e7, 1)} unit="nm" />
        <Metric label="Threshold voltage Vₜ" value={fmt(selected.thresholdVoltage, 3)} unit="V" />
        <Metric
          label="Maximum depletion width Wₜ"
          value={fmt(selected.thresholdWidth * 1e7, 1)}
          unit="nm"
        />
      </Metrics>
      <Plot
        title="Surface potential φₛ versus gate voltage"
        xLabel="Gate voltage Vᴳ (V)"
        yLabel="φₛ (V)"
        xDomain={gateRange}
        yDomain={[0, selected.thresholdPotential * 1.12]}
        markers={markers}
        height={320}
        series={[
          {
            name: 'Surface potential',
            color: '#2672d9',
            points: sweep.map((point) => [point.voltage, point.surfacePotential]),
          },
          {
            name: '2φF',
            color: '#80919c',
            dash: true,
            points: [
              [gateRange[0], selected.thresholdPotential],
              [gateRange[1], selected.thresholdPotential],
            ],
          },
        ]}
        onInspect={(voltage) =>
          `At ${fmt(voltage, 2)} V: φs = ${fmt(mosSurfaceWidth(voltage, params).surfacePotential, 3)} V`
        }
      />
      <Plot
        title="Depletion width W versus gate voltage"
        xLabel="Gate voltage Vᴳ (V)"
        yLabel="W (nm)"
        xDomain={gateRange}
        yDomain={[0, selected.thresholdWidth * 1e7 * 1.12]}
        markers={markers}
        height={320}
        series={[
          {
            name: 'Depletion width',
            color: '#14875f',
            points: sweep.map((point) => [point.voltage, point.depletionWidth * 1e7]),
          },
          {
            name: 'WT',
            color: '#80919c',
            dash: true,
            points: [
              [gateRange[0], selected.thresholdWidth * 1e7],
              [gateRange[1], selected.thresholdWidth * 1e7],
            ],
          },
        ]}
        onInspect={(voltage) =>
          `At ${fmt(voltage, 2)} V: W = ${fmt(mosSurfaceWidth(voltage, params).depletionWidth * 1e7, 1)} nm`
        }
      />
      <p className="carrier-motion-summary">
        This is the slide’s ideal depletion-approximation model. Its flat accumulation line means
        “no depletion width”; the actual surface potential in accumulation can be negative. Beyond
        threshold, φₛ and W are held near 2φF and WT while inversion charge grows. Real devices
        approach those limits gradually.
      </p>
    </DemoLayout>
  );
}
