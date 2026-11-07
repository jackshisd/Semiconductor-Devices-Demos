'use client';

import { useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, pts, useParams } from './Demos';
import Plot from './Plot';
import { varactorProfiles, varactorState, type VaractorProfile } from '../lib/varactor';

const profiles: VaractorProfile[] = ['graded', 'abrupt', 'hyperabrupt'];
const colors: Record<VaractorProfile, string> = {
  graded: '#2672d9',
  abrupt: '#dc7637',
  hyperabrupt: '#7b54b9',
};
const builtInVoltage = 0.7;

export default function VaractorDiode() {
  const { v, set, reset } = useParams({
    reverseVoltage: 3,
    zeroBiasCapacitancePf: 100,
    inductanceMicroH: 10,
  });
  const [profile, setProfile] = useState<VaractorProfile>('abrupt');
  const at = (reverseVoltage: number, kind: VaractorProfile) =>
    varactorState({
      reverseVoltage,
      zeroBiasCapacitancePf: v.zeroBiasCapacitancePf,
      builtInVoltage,
      inductanceMicroH: v.inductanceMicroH,
      profile: kind,
    });
  const state = at(v.reverseVoltage, profile);
  const initialFrequency = at(0, profile).frequencyMHz;
  const frequencyMaximum = at(10, 'hyperabrupt').frequencyMHz * 1.08;
  const maximumWidthRatio = at(10, 'hyperabrupt').widthRatio;
  const depletionWidth = 44 + (160 * Math.log(state.widthRatio)) / Math.log(maximumWidthRatio);
  const plotSeries = (measure: 'capacitancePf' | 'frequencyMHz') =>
    profiles.map((kind) => ({
      name: varactorProfiles[kind].label,
      color: colors[kind],
      dash: kind !== profile,
      points: pts(0, 10, 120, (x) => at(x, kind)[measure]),
    }));
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setProfile('abrupt');
          }}
          items={[
            {
              key: 'reverseVoltage',
              label: 'Reverse bias Vᵣ',
              min: 0,
              max: 10,
              step: 0.1,
              unit: 'V',
            },
            {
              key: 'zeroBiasCapacitancePf',
              label: 'Zero-bias capacitance C₀',
              min: 20,
              max: 300,
              step: 5,
              unit: 'pF',
            },
            {
              key: 'inductanceMicroH',
              label: 'Tank inductance L',
              min: 1,
              max: 50,
              step: 0.5,
              unit: 'µH',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Doping profile">
            {profiles.map((kind) => (
              <button
                type="button"
                key={kind}
                className={kind === profile ? 'active' : undefined}
                aria-pressed={kind === profile}
                onClick={() => setProfile(kind)}
              >
                {varactorProfiles[kind].label}
              </button>
            ))}
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Voltage-controlled junction capacitance"
          forms={[
            {
              label: 'Doping-profile grading exponent',
              formula: String.raw`n=\frac{1}{m+2},\qquad C_j(V_r)=\frac{C_0}{(1+V_r/V_{bi})^n}`,
            },
            {
              label: 'LC resonant frequency',
              formula: String.raw`\omega_0=\frac{1}{\sqrt{LC_j}},\qquad f_0=\frac{1}{2\pi\sqrt{LC_j}}`,
            },
          ]}
          substitution={String.raw`m=${varactorProfiles[profile].dopingExponent},\quad n=${fmt(state.exponent, 3)},\quad C_j=${fmt(state.capacitancePf, 2)}\,\mathrm{pF},\quad f_0=${fmt(state.frequencyMHz, 2)}\,\mathrm{MHz}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        A reverse-biased pn junction stores charge across its depletion region. Increase reverse
        bias to widen that region and lower the junction capacitance. A lower capacitance raises the
        frequency of an LC oscillator. Select a doping profile to compare how quickly the diode
        tunes.
      </p>
      <div
        className="varactor-junction"
        role="img"
        aria-label={`Reverse-biased p plus n junction. Relative depletion width ${fmt(state.widthRatio, 2)} times its zero-bias width.`}
      >
        <span className="varactor-p-side">p⁺</span>
        <span className="varactor-depletion" style={{ width: depletionWidth }}>
          depletion
          <br />
          region
        </span>
        <span className="varactor-n-side">n</span>
      </div>
      <Metrics>
        <Metric label="Junction capacitance Cⱼ" value={fmt(state.capacitancePf, 2)} unit="pF" />
        <Metric
          label="Relative depletion width"
          value={fmt(state.widthRatio, 2)}
          unit="× zero-bias width"
        />
        <Metric label="Resonant frequency f₀" value={fmt(state.frequencyMHz, 2)} unit="MHz" />
        <Metric
          label="Frequency tuning"
          value={fmt(state.frequencyMHz / initialFrequency, 2)}
          unit="× zero-bias frequency"
        />
      </Metrics>
      <div className="varactor-plots">
        <Plot
          title="Capacitance versus reverse bias"
          series={plotSeries('capacitancePf')}
          xLabel="Reverse bias Vᵣ (V)"
          yLabel="Junction capacitance (pF)"
          xDomain={[0, 10]}
          yDomain={[0, v.zeroBiasCapacitancePf * 1.08]}
          points={[
            {
              x: v.reverseVoltage,
              y: state.capacitancePf,
              label: `${fmt(state.capacitancePf, 1)} pF`,
              color: colors[profile],
            },
          ]}
          height={275}
          onInspect={(x) => `${fmt(x, 1)} V: ${fmt(at(x, profile).capacitancePf, 2)} pF`}
        />
        <Plot
          title="LC frequency versus reverse bias"
          series={plotSeries('frequencyMHz')}
          xLabel="Reverse bias Vᵣ (V)"
          yLabel="Resonant frequency (MHz)"
          xDomain={[0, 10]}
          yDomain={[0, frequencyMaximum]}
          points={[
            {
              x: v.reverseVoltage,
              y: state.frequencyMHz,
              label: `${fmt(state.frequencyMHz, 2)} MHz`,
              color: colors[profile],
            },
          ]}
          height={275}
          onInspect={(x) => `${fmt(x, 1)} V: ${fmt(at(x, profile).frequencyMHz, 2)} MHz`}
        />
      </div>
      <p className="carrier-motion-summary">
        The power-law model uses Vᵦᵢ = 0.7 V. It illustrates the slide’s three grading profiles; the
        exact capacitance and tuning range depend on the fabricated junction, and the model omits
        series resistance and breakdown.
      </p>
    </DemoLayout>
  );
}
