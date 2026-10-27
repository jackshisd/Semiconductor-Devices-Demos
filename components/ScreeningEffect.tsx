'use client';

import { useId } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, pts, sci, useParams } from './Demos';
import Plot from './Plot';
import { debyeLengthNm, screeningRatios } from '../lib/screening';

const cloud = Array.from({ length: 34 }, (_, index) => {
  const angle = index * 2.399963229728653;
  const radius = 0.16 + 2.4 * Math.sqrt((index + 0.5) / 34);
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
});

export default function ScreeningEffect() {
  const id = useId();
  const { v, set, reset } = useParams({ n: 1e16, T: 300, r: 30 });
  const length = debyeLengthNm(v.n, v.T);
  const ratio = screeningRatios(v.r, length);
  const radius = 125;
  const scale = radius / 150; // The diagram displays a fixed 150 nm radius.
  const screenRadius = Math.min(220, length * scale);
  const probeRadius = v.r * scale;
  const curve = pts(2, 150, 120, (r) => screeningRatios(r, length).potential);

  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'n',
              label: 'Mobile electron density',
              min: 1e14,
              max: 1e18,
              step: 1e13,
              unit: 'cm⁻³',
              log: true,
            },
            { key: 'T', label: 'Temperature', min: 200, max: 500, step: 10, unit: 'K' },
            { key: 'r', label: 'Probe distance', min: 5, max: 150, step: 1, unit: 'nm' },
          ]}
        />
      }
      calculation={
        <Calculation
          title="Debye screening model"
          forms={[
            {
              label: 'Screening length',
              formula: String.raw`\lambda_D=\sqrt{\frac{\varepsilon_s k_B T}{q^2 n}}`,
            },
            {
              label: 'Potential around one ion',
              formula: String.raw`\phi(r)=\frac{q}{4\pi\varepsilon_s r}e^{-r/\lambda_D}`,
            },
          ]}
          substitution={String.raw`\lambda_D=${fmt(length, 1)}\;\mathrm{nm},\quad\frac{\phi(${fmt(v.r, 0)}\,\mathrm{nm})}{\phi_{\rm bare}}=${fmt(ratio.potential, 3)}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Mobile electrons gather around a positive donor ion and partly cancel its field. Raise the
        electron density to make the screening cloud narrower; move the probe to see how much of the
        ion&apos;s potential and field remain at that distance.
      </p>
      <Metrics>
        <Metric label="Debye length" value={fmt(length, 1)} unit="nm" />
        <Metric
          label="Potential remaining"
          value={fmt(ratio.potential * 100, 1)}
          unit="% of bare ion"
        />
        <Metric label="Field remaining" value={fmt(ratio.field * 100, 1)} unit="% of bare ion" />
      </Metrics>
      <section className="plot-card screening-scene" aria-label="Screening cloud diagram">
        <div className="plot-title">
          <b>One ion in mobile silicon</b>
          <span>Fixed spatial scale · radius 150 nm</span>
        </div>
        <svg
          viewBox="0 0 520 320"
          role="img"
          aria-label={`Positive donor ion with screening electrons. Debye length ${fmt(length, 1)} nanometers and probe ${fmt(v.r, 0)} nanometers away.`}
        >
          <defs>
            <radialGradient id={`${id}-halo`}>
              <stop offset="0%" stopColor="#4d9fdd" stopOpacity="0.35" />
              <stop offset="65%" stopColor="#4d9fdd" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#4d9fdd" stopOpacity="0" />
            </radialGradient>
            <clipPath id={`${id}-view`}>
              <rect x="68" y="19" width="355" height="277" rx="8" />
            </clipPath>
          </defs>
          <rect x="68" y="19" width="355" height="277" rx="8" fill="#f5f9fc" />
          <g clipPath={`url(#${id}-view)`}>
            {[50, 100, 150].map((distance) => (
              <circle
                key={distance}
                cx="245"
                cy="156"
                r={distance * scale}
                fill="none"
                stroke="#d5e0e6"
                strokeDasharray="3 5"
              />
            ))}
            <circle cx="245" cy="156" r={screenRadius * 2.5} fill={`url(#${id}-halo)`} />
            <circle
              cx="245"
              cy="156"
              r={screenRadius}
              fill="none"
              stroke="#397fc0"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            {cloud.map((electron, index) => {
              const x = 245 + electron.x * length * scale;
              const y = 156 + electron.y * length * scale;
              return <circle key={index} cx={x} cy={y} r="3.5" fill="#448fd0" opacity="0.8" />;
            })}
            <circle
              cx="245"
              cy="156"
              r={probeRadius}
              fill="none"
              stroke="#d06d43"
              strokeWidth="2"
              opacity="0.85"
            />
            <line
              x1="245"
              y1="156"
              x2={245 + probeRadius}
              y2="156"
              stroke="#d06d43"
              strokeWidth="2"
            />
            <circle cx={245 + probeRadius} cy="156" r="6" fill="#d06d43" />
          </g>
          <circle cx="245" cy="156" r="14" fill="#d78b46" stroke="#fff" strokeWidth="3" />
          <text x="245" y="161" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">
            +
          </text>
          <text x="245" y="306" textAnchor="middle" fill="#526a77" fontSize="12">
            Blue dots: mobile electrons · dashed circle: λD · orange ring: probe distance
          </text>
        </svg>
        <p className="teaching-caption">
          The blue dots sketch a redistribution of mobile electrons around one positive ion. The
          dashed circle marks one Debye length; the cloud may extend beyond the window at low
          density. Dot positions are illustrative, not individual simulated trajectories.
        </p>
      </section>
      <Plot
        title="How much of the ion’s potential remains?"
        xLabel="Distance from ion (nm)"
        yLabel="screened / bare potential"
        xDomain={[2, 150]}
        yDomain={[0, 1.05]}
        height={300}
        series={[
          {
            name: 'Bare ion',
            color: '#a68b70',
            dash: true,
            points: [
              [2, 1],
              [150, 1],
            ],
          },
          { name: 'Screened ion', color: '#307ebb', points: curve },
        ]}
        markers={[{ x: v.r, label: 'Probe' }]}
        points={[
          {
            x: v.r,
            y: ratio.potential,
            label: `${fmt(ratio.potential * 100, 1)}%`,
            color: '#307ebb',
          },
        ]}
        onInspect={(r) =>
          `${fmt(r, 0)} nm · ${fmt(screeningRatios(r, length).potential * 100, 1)}% of bare potential`
        }
      />
      <p className="teaching-caption">
        In a simple, fully ionized n-type sample, more donors also supply more mobile electrons, so
        the screening length shrinks roughly as 1/√n. Screening weakens the field of each ion at a
        distance, but extra dopants add scattering centers; this diagram alone does not predict the
        mobility curve. Current mobile density: {sci(v.n)} cm⁻³.
      </p>
    </DemoLayout>
  );
}
