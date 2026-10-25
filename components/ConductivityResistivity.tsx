'use client';

import { Controls } from './Controls';
import {
  Calculation,
  DemoLayout,
  Metric,
  Metrics,
  fmt,
  pts,
  sci,
  texSci,
  useParams,
} from './Demos';
import Plot from './Plot';
import { q } from '../lib/physics';

export function ConductivityResistivity() {
  const { v, set, reset } = useParams({ n: 1e16, p: 1e14, muN: 1400, muP: 470, field: 100 });
  const electronConductivity = q * v.n * v.muN;
  const holeConductivity = q * v.p * v.muP;
  const conductivity = electronConductivity + holeConductivity;
  const resistivity = 1 / conductivity;
  const electronCurrent = electronConductivity * v.field;
  const holeCurrent = holeConductivity * v.field;
  const totalCurrent = conductivity * v.field;
  const maxCurrent = conductivity * 500 * 1.08;
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
              label: 'Electron concentration n',
              min: 1e10,
              max: 1e19,
              step: 1e10,
              unit: 'cm⁻³',
              log: true,
            },
            {
              key: 'p',
              label: 'Hole concentration p',
              min: 1e10,
              max: 1e19,
              step: 1e10,
              unit: 'cm⁻³',
              log: true,
            },
            {
              key: 'muN',
              label: 'Electron mobility μn',
              min: 100,
              max: 2000,
              step: 10,
              unit: 'cm²/(V·s)',
            },
            {
              key: 'muP',
              label: 'Hole mobility μp',
              min: 50,
              max: 1000,
              step: 10,
              unit: 'cm²/(V·s)',
            },
            { key: 'field', label: 'Electric field', min: -500, max: 500, step: 10, unit: 'V/cm' },
          ]}
        />
      }
      calculation={
        <Calculation
          title="Electron and hole contributions add"
          formula={String.raw`\sigma=q(n\mu_n+p\mu_p),\qquad\rho=\frac{1}{\sigma},\qquad J_{\mathrm{drift}}=\sigma\mathcal E`}
          substitution={String.raw`\sigma=(${texSci(q)})[(${texSci(v.n)})(${fmt(v.muN, 0)})+(${texSci(v.p)})(${fmt(v.muP, 0)})]=${texSci(conductivity)}\,\mathrm{S/cm},\quad\rho=${texSci(resistivity)}\,\Omega\cdot\mathrm{cm}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Electrons move opposite the field and holes move with it. Both carry conventional current in
        the field direction, so their conductivity contributions add.
      </p>
      <Metrics>
        <Metric label="Conductivity σ" value={sci(conductivity)} unit="S/cm" />
        <Metric label="Resistivity ρ" value={sci(resistivity)} unit="Ω·cm" />
        <Metric label="Electron contribution σn" value={sci(electronConductivity)} unit="S/cm" />
        <Metric label="Hole contribution σp" value={sci(holeConductivity)} unit="S/cm" />
        <Metric label="Total drift current J" value={sci(totalCurrent)} unit="A/cm²" />
      </Metrics>
      <Plot
        title="Drift current from electrons and holes"
        xLabel="Electric field (V/cm)"
        yLabel="Current density (A/cm²)"
        xDomain={[-500, 500]}
        yDomain={[-maxCurrent, maxCurrent]}
        series={[
          {
            name: 'Electrons',
            color: '#2672d9',
            points: pts(-500, 500, 100, (field) => electronConductivity * field),
          },
          {
            name: 'Holes',
            color: '#d56138',
            points: pts(-500, 500, 100, (field) => holeConductivity * field),
          },
          {
            name: 'Total',
            color: '#14875f',
            points: pts(-500, 500, 100, (field) => conductivity * field),
          },
        ]}
        markers={[{ x: v.field, label: `E = ${fmt(v.field, 0)} V/cm` }]}
        points={[
          {
            x: v.field,
            y: electronCurrent,
            label: `Jn = ${sci(electronCurrent)}`,
            color: '#2672d9',
          },
          { x: v.field, y: holeCurrent, label: `Jp = ${sci(holeCurrent)}`, color: '#d56138' },
          { x: v.field, y: totalCurrent, label: `J = ${sci(totalCurrent)}`, color: '#14875f' },
        ]}
        height={340}
        onInspect={(field) =>
          `${fmt(field, 0)} V/cm · Jn = ${sci(electronConductivity * field)} · Jp = ${sci(holeConductivity * field)} · J = ${sci(conductivity * field)} A/cm²`
        }
      />
      <p className="teaching-caption concentration-temperature-caption">
        Mobilities are held at the selected values to isolate the conductivity equation. Real
        mobilities also vary with temperature and doping.
      </p>
    </DemoLayout>
  );
}
