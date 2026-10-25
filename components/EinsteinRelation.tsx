'use client';

import { useState } from 'react';
import { Controls, Toggle } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, pts, sci, useParams } from './Demos';
import Plot from './Plot';
import { q, thermalVoltage } from '../lib/physics';

export function EinsteinRelation() {
  const { v, set, reset } = useParams({ T: 300, muN: 1400, muP: 410, length: 5, offset: 0 });
  const [holes, setHoles] = useState(false);
  const voltage = thermalVoltage(v.T);
  const Dn = v.muN * voltage;
  const Dp = v.muP * voltage;
  const lengthCm = v.length * 1e-4;
  const equilibriumField = -voltage / lengthCm;
  const mobility = holes ? v.muP : v.muN;
  const diffusion = holes ? Dp : Dn;
  const density = 1e15; // Local illustrative density; the normalized gradient is 1/L.
  const diffusionCurrent = (q * density * diffusion) / lengthCm;
  const driftCurrent = (offset: number) => q * density * mobility * (equilibriumField + offset);
  const totalCurrent = (offset: number) => driftCurrent(offset) + diffusionCurrent;
  const bound =
    Math.max(
      Math.abs(driftCurrent(-100)),
      Math.abs(driftCurrent(100)),
      Math.abs(diffusionCurrent),
      Math.abs(totalCurrent(-100)),
      Math.abs(totalCurrent(100)),
    ) * 1.1;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setHoles(false);
          }}
          items={[
            { key: 'T', label: 'Temperature', min: 200, max: 500, step: 1, unit: 'K' },
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
            { key: 'length', label: 'Gradient length L', min: 1, max: 20, step: 0.5, unit: 'µm' },
            {
              key: 'offset',
              label: 'Field offset from equilibrium',
              min: -100,
              max: 100,
              step: 1,
              unit: 'V/cm',
            },
          ]}
        >
          <Toggle label="Show hole currents" checked={holes} onChange={setHoles} />
        </Controls>
      }
      calculation={
        <Calculation
          title="Einstein relation and equilibrium field"
          formula={String.raw`\frac{D_n}{\mu_n}=\frac{D_p}{\mu_p}=\frac{k_BT}{q}=V_T,\qquad\mathcal E_{\rm eq}=-\frac{V_T}{L}`}
          substitution={String.raw`T=${fmt(v.T, 0)}\,\mathrm K,\quad V_T=${fmt(voltage, 4)}\,\mathrm V,\quad D_n=${fmt(Dn, 2)}\,\mathrm{cm^2/s},\quad D_p=${fmt(Dp, 2)}\,\mathrm{cm^2/s},\quad\mathcal E_{\rm eq}=${fmt(equilibriumField, 1)}\,\mathrm{V/cm}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        At equilibrium, a built-in field balances diffusion. Move the field away from that value to
        see a net current; switch carriers to compare the electron and hole forms.
      </p>
      <Metrics>
        <Metric label="Thermal voltage kT/q" value={fmt(voltage * 1000, 2)} unit="mV" />
        <Metric label="Electron diffusion constant Dn" value={fmt(Dn, 2)} unit="cm²/s" />
        <Metric label="Hole diffusion constant Dp" value={fmt(Dp, 2)} unit="cm²/s" />
        <Metric label="Equilibrium field" value={fmt(equilibriumField, 1)} unit="V/cm" />
        <Metric label="Selected net current" value={sci(totalCurrent(v.offset))} unit="A/cm²" />
      </Metrics>
      <div className="graph-grid">
        <Plot
          title="Diffusion constants grow with temperature"
          xLabel="Temperature (K)"
          yLabel="D (cm²/s)"
          xDomain={[200, 500]}
          yDomain={[0, Math.max(v.muN, v.muP) * thermalVoltage(500) * 1.08]}
          series={[
            {
              name: 'Dn = μn kT/q',
              color: '#2672d9',
              points: pts(200, 500, 100, (T) => v.muN * thermalVoltage(T)),
            },
            {
              name: 'Dp = μp kT/q',
              color: '#d56138',
              points: pts(200, 500, 100, (T) => v.muP * thermalVoltage(T)),
            },
          ]}
          markers={[{ x: v.T, label: `T = ${fmt(v.T, 0)} K` }]}
          points={[
            { x: v.T, y: Dn, label: `Dn = ${fmt(Dn, 2)}`, color: '#2672d9' },
            { x: v.T, y: Dp, label: `Dp = ${fmt(Dp, 2)}`, color: '#d56138' },
          ]}
          onInspect={(T) =>
            `${fmt(T, 0)} K · Dn = ${fmt(v.muN * thermalVoltage(T), 2)} · Dp = ${fmt(v.muP * thermalVoltage(T), 2)} cm²/s`
          }
        />
        <Plot
          title={`${holes ? 'Hole' : 'Electron'} drift and diffusion cancel at equilibrium`}
          xLabel="Field offset from equilibrium (V/cm)"
          yLabel="Current density (A/cm²)"
          xDomain={[-100, 100]}
          yDomain={[-bound, bound]}
          series={[
            { name: 'Drift', color: '#2672d9', points: pts(-100, 100, 100, driftCurrent) },
            {
              name: 'Diffusion',
              color: '#d56138',
              points: pts(-100, 100, 100, () => diffusionCurrent),
            },
            { name: 'Net', color: '#14875f', points: pts(-100, 100, 100, totalCurrent) },
          ]}
          markers={[{ x: v.offset, label: `ΔE = ${fmt(v.offset, 0)} V/cm` }]}
          points={[
            {
              x: v.offset,
              y: totalCurrent(v.offset),
              label: `J = ${sci(totalCurrent(v.offset))}`,
              color: '#14875f',
            },
          ]}
          onInspect={(offset) =>
            `ΔE ${fmt(offset, 0)} V/cm · drift ${sci(driftCurrent(offset))} · diffusion ${sci(diffusionCurrent)} · net ${sci(totalCurrent(offset))} A/cm²`
          }
        />
      </div>
      <p className="teaching-caption concentration-temperature-caption">
        The local density is 10¹⁵ cm⁻³. The electron density increases with position and the hole
        density decreases over the selected length L. Mobilities are held fixed during the
        temperature sweep to isolate D/μ; the relation shown assumes nondegenerate statistics.
      </p>
    </DemoLayout>
  );
}
