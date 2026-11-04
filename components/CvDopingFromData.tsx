'use client';

import { Controls } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, sci, texSci, useParams } from './Demos';
import Plot from './Plot';
import { cvDopingExperiment } from '../lib/cv-doping';

export default function CvDopingFromData() {
  const { v, set, reset } = useParams({
    Nlight: 6e15,
    Nheavy: 1.8e17,
    areaUm2: 100,
    noise: 0,
    probe: 4,
  });
  const area = v.areaUm2 * 1e-8;
  const result = cvDopingExperiment({
    lightDoping: v.Nlight,
    heavyDoping: v.Nheavy,
    area,
    noisePercent: v.noise,
  });
  const selected = result.measurements[Math.round(v.probe)];
  const inverseScaleExponent = Math.floor(Math.log10(result.measurements[0].inverseSquare));
  const inverseScale = 10 ** inverseScaleExponent;
  const inverseY = (value: number) => value / inverseScale;
  const capacitances = result.measurements.map(
    (point) => [point.voltage, point.capacitance * 1e15] as [number, number],
  );
  const inverse = result.measurements.map(
    (point) => [point.voltage, inverseY(point.inverseSquare)] as [number, number],
  );
  const fit = [
    [-2, inverseY(result.fittedInverseSquare(-2))],
    [result.extractedBuiltIn, 0],
  ] as [number, number][];
  const xMax = Math.max(1, result.extractedBuiltIn + 0.1);
  const inverseMax = Math.max(...inverse.map((point) => point[1]), fit[0][1]) * 1.12;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={reset}
          items={[
            {
              key: 'Nlight',
              label: 'Device light-side doping',
              min: 1e15,
              max: 1e16,
              step: 1e14,
              unit: 'cm⁻³',
              log: true,
            },
            {
              key: 'Nheavy',
              label: 'Device heavy-side doping',
              min: 1e17,
              max: 5e17,
              step: 1e16,
              unit: 'cm⁻³',
              log: true,
            },
            {
              key: 'areaUm2',
              label: 'Junction area',
              min: 1,
              max: 1e4,
              step: 1,
              unit: 'µm²',
              log: true,
            },
            {
              key: 'noise',
              label: 'Capacitance measurement variation',
              min: 0,
              max: 3,
              step: 0.1,
              unit: '%',
            },
            {
              key: 'probe',
              label: 'Inspect measurement row',
              min: 0,
              max: 8,
              step: 1,
              unit: '0–8',
            },
          ]}
        />
      }
      calculation={
        <Calculation
          title="Extract doping from the fitted C–V line"
          forms={[
            {
              label: 'One-sided reverse-biased junction',
              formula: String.raw`\frac{1}{C_J^2}\simeq\frac{2(V_{bi}-V_A)}{q\varepsilon_s A^2N_{\rm light}}=mV_A+b`,
            },
            {
              label: 'Slope, intercept, and optional heavy-side inference',
              formula: String.raw`N_{\rm light}=\frac{2}{q\varepsilon_s A^2|m|},\quad V_{bi}=-\frac{b}{m},\quad N_{\rm heavy}=\frac{n_i^2}{N_{\rm light}}e^{V_{bi}/V_T}`,
            },
          ]}
          substitution={String.raw`m=${texSci(result.slope)}\,\mathrm{F^{-2}V^{-1}},\quad N_{\rm light}=${texSci(result.extractedLightDoping)}\,\mathrm{cm^{-3}}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        Measure junction capacitance at several reverse biases. The capacitance curve bends, but
        plotting 1/C² against voltage gives a line whose slope reveals the lightly doped side.
      </p>
      <div className="cv-doping-steps">
        <span>1 · Measure C(V)</span>
        <span>2 · Fit 1/C² vs. V</span>
        <span>3 · Read doping and Vᵦᵢ</span>
      </div>
      <Metrics>
        <Metric label="Selected reverse bias" value={fmt(selected.voltage, 2)} unit="V" />
        <Metric label="Measured capacitance" value={sci(selected.capacitance * 1e15)} unit="fF" />
        <Metric label="Fitted slope" value={sci(result.slope)} unit="F⁻²/V" />
        <Metric
          label="Extracted light-side doping"
          value={sci(result.extractedLightDoping)}
          unit="cm⁻³"
        />
        <Metric
          label="Light-side error"
          value={fmt(100 * (result.extractedLightDoping / v.Nlight - 1), 2)}
          unit="%"
        />
        <Metric label="Voltage intercept Vᵦᵢ" value={fmt(result.extractedBuiltIn, 3)} unit="V" />
        <Metric
          label="Inferred heavy-side doping"
          value={sci(result.extractedHeavyDoping)}
          unit="cm⁻³"
        />
      </Metrics>
      <div className="cv-doping-graphs">
        <Plot
          title="Step 1 · Reverse-bias C–V readings"
          xLabel="Applied voltage Vₐ (V)"
          yLabel="Measured Cⱼ (fF)"
          xDomain={[-2, 0]}
          yDomain={[0, Math.max(...capacitances.map((point) => point[1])) * 1.18]}
          height={300}
          series={[{ name: 'Capacitance data', color: '#2672d9', points: capacitances }]}
          points={[
            {
              x: selected.voltage,
              y: selected.capacitance * 1e15,
              label: 'Selected reading',
              color: '#2672d9',
            },
          ]}
        />
        <Plot
          title="Step 2 · Straight-line 1/C² fit and intercept"
          xLabel="Applied voltage Vₐ (V)"
          yLabel={`1/C² (×10^${inverseScaleExponent} F⁻²)`}
          xDomain={[-2, xMax]}
          yDomain={[0, inverseMax]}
          height={330}
          series={[
            { name: 'Transformed readings', color: '#d47748', points: inverse },
            { name: 'Linear fit · extrapolated', color: '#298474', dash: true, points: fit },
          ]}
          points={[
            {
              x: selected.voltage,
              y: inverseY(selected.inverseSquare),
              label: 'Selected reading',
              color: '#d47748',
            },
          ]}
          markers={[{ x: result.extractedBuiltIn, label: 'Vᵦᵢ intercept' }]}
        />
      </div>
      <details className="cv-doping-table-wrap">
        <summary>See all nine measured values</summary>
        <table>
          <thead>
            <tr>
              <th>Vₐ (V)</th>
              <th>Cⱼ (fF)</th>
              <th>1/C² (F⁻²)</th>
            </tr>
          </thead>
          <tbody>
            {result.measurements.map((point) => (
              <tr
                key={point.voltage}
                className={point.voltage === selected.voltage ? 'selected' : ''}
              >
                <td>{fmt(point.voltage, 2)}</td>
                <td>{fmt(point.capacitance * 1e15, 3)}</td>
                <td>{sci(point.inverseSquare)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <p className="teaching-caption">
        The slope gives N on the more lightly doped side; the x-intercept gives Vᵦᵢ. The heavy-side
        estimate additionally assumes the ideal nondegenerate built-in-voltage relation and can be
        sensitive to small fitting errors. These are synthetic one-sided abrupt-junction readings
        with optional repeatable measurement variation. Use depletion capacitance under reverse
        bias; forward-bias diffusion capacitance would spoil this fit.
      </p>
    </DemoLayout>
  );
}
