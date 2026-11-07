'use client';

import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, pts, texSci, useParams } from './Demos';
import Plot from './Plot';
import { maximumPowerPoint, solarCellState } from '../lib/solar-cell-ocv';

export default function SolarCellOcv() {
  const { v, set, reset } = useParams({ suns: 1, saturationCurrent: 4e-12, voltage: 0.45 });
  const at = (voltage: number, suns = v.suns) =>
    solarCellState({ illuminationSuns: suns, saturationCurrentAcm2: v.saturationCurrent, voltage });
  const state = at(v.voltage);
  const mpp = maximumPowerPoint(v.suns, v.saturationCurrent);
  const maxCurrent = Math.max(55, state.lightCurrentMa * 1.15);
  const darkAt = (voltage: number) => Math.min(65, at(voltage, 0).terminalCurrentMa);
  const litAt = (voltage: number) => Math.min(65, at(voltage).terminalCurrentMa);
  const upperVoltage = 0.78;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            { key: 'suns', label: 'Illumination', min: 0, max: 2, step: 0.05, unit: 'suns' },
            {
              key: 'saturationCurrent',
              label: 'Dark saturation current density J₀',
              min: 1e-13,
              max: 1e-10,
              step: 1e-13,
              unit: 'A/cm²',
              log: true,
            },
            {
              key: 'voltage',
              label: 'Operating voltage Vₐ',
              min: 0,
              max: upperVoltage,
              step: 0.005,
              unit: 'V',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Solar-cell operating points">
            <button type="button" onClick={() => set('voltage', 0)}>
              Short circuit
            </button>
            <button type="button" onClick={() => set('voltage', mpp.voltage)}>
              Maximum power
            </button>
            <button type="button" onClick={() => set('voltage', state.openCircuitVoltage)}>
              Open circuit
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Light current balances diode current at open circuit"
          forms={[
            {
              label: 'Illuminated terminal current density',
              formula: String.raw`J(V)=J_0\left(e^{V/V_T}-1\right)-J_L,\qquad V_T=\frac{kT}{q}`,
            },
            {
              label: 'Set terminal current to zero',
              formula: String.raw`V_{OC}=V_T\ln\!\left(1+\frac{J_L}{J_0}\right),\qquad P_{out}=-VJ`,
            },
          ]}
          substitution={String.raw`J_L=${fmt(state.lightCurrentMa, 1)}\,\mathrm{mA/cm^2},\quad J_0=${texSci(v.saturationCurrent)}\,\mathrm{A/cm^2},\quad V_{OC}=${fmt(state.openCircuitVoltage, 3)}\,\mathrm V`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Light shifts the diode I–V curve downward. At open circuit, the terminal current is zero
        because forward diode current exactly balances photocurrent. Move the operating voltage to
        see when the cell delivers current and power to a load.
      </p>
      <Metrics>
        <Metric
          label="Open-circuit voltage Vₒ꜀"
          value={fmt(state.openCircuitVoltage, 3)}
          unit="V"
        />
        <Metric
          label="Short-circuit current density Jꜱ꜀"
          value={fmt(state.shortCircuitCurrentMa, 1)}
          unit="mA/cm²"
        />
        <Metric label="Maximum power density" value={fmt(mpp.powerMw, 2)} unit="mW/cm²" />
        <Metric label="Fill factor" value={fmt(mpp.fillFactor * 100, 1)} unit="%" />
      </Metrics>
      <div className="solar-current-balance" aria-label="Current balance at the selected voltage">
        <div>
          <span>Light-generated current</span>
          <strong>{fmt(state.lightCurrentMa, 2)} mA/cm²</strong>
          <div className="solar-balance-track">
            <i style={{ width: `${Math.min(100, (state.lightCurrentMa / 100) * 100)}%` }} />
          </div>
        </div>
        <div>
          <span>Opposing diode current</span>
          <strong>{fmt(state.diodeCurrentMa, 2)} mA/cm²</strong>
          <div className="solar-balance-track">
            <i style={{ width: `${Math.min(100, (state.diodeCurrentMa / 100) * 100)}%` }} />
          </div>
        </div>
        <p role="status">
          Net terminal current: {fmt(state.terminalCurrentMa, 2)} mA/cm² · Output power:{' '}
          {fmt(state.outputPowerMw, 2)} mW/cm²
        </p>
      </div>
      <div className="solar-ocv-plots">
        <Plot
          title="Dark and illuminated I–V curves"
          series={[
            {
              name: 'Dark diode',
              color: '#838c9a',
              dash: true,
              points: pts(0, upperVoltage, 180, darkAt),
            },
            {
              name: 'Illuminated cell',
              color: '#2672d9',
              points: pts(0, upperVoltage, 180, litAt),
            },
            {
              name: 'Zero current',
              color: '#607580',
              dash: true,
              points: [
                [0, 0],
                [upperVoltage, 0],
              ],
            },
          ]}
          xLabel="Cell voltage (V)"
          yLabel="Terminal current density (mA/cm²)"
          xDomain={[0, upperVoltage]}
          yDomain={[-maxCurrent, 65]}
          points={[
            {
              x: state.openCircuitVoltage,
              y: 0,
              label: `Voc ${fmt(state.openCircuitVoltage, 3)} V`,
              color: '#2672d9',
            },
            {
              x: v.voltage,
              y: Math.min(65, state.terminalCurrentMa),
              label: 'Operating point',
              color: '#d66535',
            },
          ]}
          height={300}
          onInspect={(x) => `${fmt(x, 3)} V: J = ${fmt(at(x).terminalCurrentMa, 2)} mA/cm²`}
        />
        <Plot
          title="Electrical power delivered to a load"
          series={[
            {
              name: 'Output power',
              color: '#d66535',
              points: pts(0, state.openCircuitVoltage, 150, (x) => at(x).outputPowerMw),
            },
          ]}
          xLabel="Cell voltage (V)"
          yLabel="Output power density (mW/cm²)"
          xDomain={[0, upperVoltage]}
          yDomain={[0, Math.max(1, mpp.powerMw * 1.17)]}
          points={[
            {
              x: mpp.voltage,
              y: mpp.powerMw,
              label: `MPP ${fmt(mpp.voltage, 3)} V`,
              color: '#d66535',
            },
            {
              x: v.voltage,
              y: state.outputPowerMw,
              label: `${fmt(state.outputPowerMw, 1)} mW/cm²`,
              color: '#2672d9',
            },
          ]}
          height={265}
          onInspect={(x) => `${fmt(x, 3)} V: ${fmt(at(x).outputPowerMw, 2)} mW/cm²`}
        />
      </div>
      <p className="carrier-motion-summary">
        Ideal 300 K model using 50 mA/cm² photocurrent per sun, based on the slide’s silicon
        example. The dark saturation current is adjustable. Real-cell series resistance, shunts, and
        recombination can lower Vₒ꜀ and fill factor.
      </p>
    </DemoLayout>
  );
}
