'use client';

import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, pts, texSci, useParams } from './Demos';
import Plot from './Plot';
import {
  forwardCurrent,
  forwardVoltage,
  saturationCurrent,
  voltageSensitivity,
} from '../lib/diode-temperature-sensor';

const referenceTemperatures = [-25, 25, 75];
const colors = ['#287abf', '#e79324', '#bf4a64'];

export default function DiodeTemperatureSensor() {
  const { v, set, reset } = useParams({ temperatureC: 25, currentMicroA: 300 });
  const temperatureK = v.temperatureC + 273.15;
  const currentA = v.currentMicroA * 1e-6;
  const voltage = forwardVoltage(currentA, temperatureK);
  const referenceVoltage = forwardVoltage(currentA, 298.15);
  const sensitivity = voltageSensitivity(currentA, temperatureK) * 1e3;
  const iv = [
    ...referenceTemperatures.map((celsius, index) => ({
      name: `${celsius} °C`,
      color: colors[index],
      points: pts(0.28, 0.72, 150, (x) =>
        Math.min(1100, forwardCurrent(x, celsius + 273.15) * 1e6),
      ),
    })),
    {
      name: `Selected: ${fmt(v.temperatureC, 0)} °C`,
      color: '#14875f',
      points: pts(0.28, 0.72, 150, (x) => Math.min(1100, forwardCurrent(x, temperatureK) * 1e6)),
    },
    {
      name: 'Fixed sensor current',
      color: '#566177',
      dash: true,
      points: [
        [0.28, v.currentMicroA],
        [0.72, v.currentMicroA],
      ] as [number, number][],
    },
  ];
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'temperatureC',
              label: 'Junction temperature',
              min: -25,
              max: 100,
              step: 1,
              unit: '°C',
            },
            {
              key: 'currentMicroA',
              label: 'Constant bias current',
              min: 10,
              max: 1000,
              step: 10,
              unit: 'µA',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Temperature presets">
            {referenceTemperatures.map((celsius) => (
              <button type="button" key={celsius} onClick={() => set('temperatureC', celsius)}>
                {celsius} °C
              </button>
            ))}
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Read temperature from forward voltage"
          forms={[
            {
              label: 'Ideal diode at fixed forward current',
              formula: String.raw`I=I_S(T)\left(e^{V_F/V_T}-1\right),\qquad V_T=\frac{kT}{q}`,
            },
            {
              label: 'Solve for the voltage measured by the sensor',
              formula: String.raw`V_F(T)=V_T\ln\!\left(1+\frac{I}{I_S(T)}\right)`,
            },
          ]}
          substitution={String.raw`T=${fmt(temperatureK, 2)}\,\mathrm K,\quad I=${texSci(currentA)}\,\mathrm A,\quad V_F=${fmt(voltage, 3)}\,\mathrm V`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Hold the diode current constant and change its temperature. The I–V curve shifts left as the
        junction warms, so the same current requires less forward voltage. The green curve follows
        your temperature; its intersection with the dashed current line is the sensor reading.
      </p>
      <Metrics>
        <Metric label="Measured forward voltage" value={fmt(voltage, 3)} unit="V" />
        <Metric label="Voltage at 25 °C" value={fmt(referenceVoltage, 3)} unit="V" />
        <Metric
          label="Change from 25 °C"
          value={fmt((voltage - referenceVoltage) * 1e3, 1)}
          unit="mV"
        />
        <Metric label="Local sensitivity" value={fmt(sensitivity, 2)} unit="mV/°C" />
      </Metrics>
      <div className="diode-temperature-plots">
        <Plot
          title="I–V curves at different temperatures"
          series={iv}
          xLabel="Forward voltage (V)"
          yLabel="Current (µA)"
          xDomain={[0.28, 0.72]}
          yDomain={[0, 1000]}
          points={[
            { x: voltage, y: v.currentMicroA, label: `${fmt(voltage, 3)} V`, color: '#14875f' },
          ]}
          height={295}
          onInspect={(x) =>
            `At ${fmt(x, 3)} V and ${fmt(v.temperatureC, 0)} °C: ${fmt(forwardCurrent(x, temperatureK) * 1e6, 1)} µA`
          }
        />
        <Plot
          title="Sensor calibration at the selected current"
          series={[
            {
              name: `${fmt(v.currentMicroA, 0)} µA`,
              color: '#14875f',
              points: pts(-25, 100, 125, (x) => forwardVoltage(currentA, x + 273.15)),
            },
          ]}
          xLabel="Temperature (°C)"
          yLabel="Forward voltage (V)"
          xDomain={[-25, 100]}
          yDomain={[0.25, 0.75]}
          points={[
            { x: v.temperatureC, y: voltage, label: `${fmt(voltage, 3)} V`, color: '#14875f' },
          ]}
          height={255}
          onInspect={(x) => `At ${fmt(x, 1)} °C: ${fmt(forwardVoltage(currentA, x + 273.15), 3)} V`}
        />
      </div>
      <p className="carrier-motion-summary">
        Illustrative silicon model: Iₛ(25 °C) = 0.1 pA and Iₛ(T) follows T³exp(−Eg/kT) with Eg =
        1.12 eV. Actual diodes need calibration at a known current; series resistance and nonideal
        recombination change the reading.
      </p>
      <span className="sr-only">
        Saturation current at the selected temperature is{' '}
        {saturationCurrent(temperatureK).toExponential(2)} amperes.
      </span>
    </DemoLayout>
  );
}
