'use client';

import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { InlineControlsContext } from './DemoPresentation';
import katex from 'katex';
import Plot, { EnergyBracket, PointLabel, SpanLabel } from './Plot';
import { Controls, Control, Toggle } from './Controls';
import { useChangeHighlight } from './useChangeHighlight';
import { highlightChangedNumbers } from '../lib/formulaHighlight';
import * as P from '../lib/physics';
export const blue = '#2672d9',
  orange = '#d56138',
  green = '#14875f',
  purple = '#7654ba',
  yellow = '#ae7b16';
export const pts = (
  a: number,
  b: number,
  n: number,
  fn: (x: number) => number,
): [number, number][] =>
  Array.from(
    {
      length: n + 1,
    },
    (_, i) => {
      const x = a + ((b - a) * i) / n;
      return [x, fn(x)];
    },
  );
const sample = (data: [number, number][], x: number) => {
  let i = 1;
  while (i < data.length - 1 && data[i][0] < x) i++;
  const a = data[i - 1],
    b = data[i],
    t = (x - a[0]) / (b[0] - a[0]);
  return a[1] + t * (b[1] - a[1]);
};
export const sci = (n: number, d = 2) => {
  if (n === 0) return '0';
  const exponent = Math.floor(Math.log10(Math.abs(n)));
  const mantissa = Number((n / 10 ** exponent).toPrecision(d + 1));
  const superscript = String(exponent).replace(
    /[0-9-]/g,
    (digit) =>
      ({
        '0': '⁰',
        '1': '¹',
        '2': '²',
        '3': '³',
        '4': '⁴',
        '5': '⁵',
        '6': '⁶',
        '7': '⁷',
        '8': '⁸',
        '9': '⁹',
        '-': '⁻',
      })[digit] ?? digit,
  );
  return `${mantissa} × 10${superscript}`;
};
export const fmt = (n: number, d = 3) => Number(n).toFixed(d);
export const texSci = (n: number) => {
  if (n === 0) return '0';
  const [mantissa, exponent] = n.toExponential(2).split('e');
  return `${Number(mantissa)}\\times10^{${Number(exponent)}}`;
};
const Equation = memo(function Equation({
  expression,
  inline = false,
}: {
  expression: string;
  inline?: boolean;
}) {
  const html = useMemo(
    () => ({
      __html: katex.renderToString(expression, {
        throwOnError: false,
        displayMode: !inline,
        trust: (context) => context.command === '\\htmlClass',
        strict: 'ignore',
      }),
    }),
    [expression, inline],
  );
  return <div className="calculation-math" dangerouslySetInnerHTML={html} />;
});
export function Calculation({
  formula,
  forms,
  substitution,
  title = 'Live calculation',
}: {
  formula?: string;
  forms?: { label: string; formula: string }[];
  substitution: string;
  title?: string;
}) {
  const previous = useRef(substitution);
  const [displayed, setDisplayed] = useState(substitution);
  useEffect(() => {
    if (previous.current === substitution) return;
    setDisplayed(highlightChangedNumbers(previous.current, substitution));
    previous.current = substitution;
    const timer = window.setTimeout(() => setDisplayed(substitution), 800);
    return () => window.clearTimeout(timer);
  }, [substitution]);
  return (
    <section className="calculation" aria-label={title}>
      <div className="calculation-heading">{title}</div>
      <div className="calculation-pair">
        {forms ? (
          <div className="calculation-forms">
            {forms.map((form) => (
              <div className="calculation-form" key={form.label}>
                <span>{form.label}</span>
                <Equation expression={form.formula} />
              </div>
            ))}
          </div>
        ) : (
          formula && (
            <div>
              <span>Formula</span>
              <Equation expression={formula} />
            </div>
          )
        )}
        <div className="calculation-current-values">
          <span>With current values</span>
          <Equation expression={displayed} inline />
        </div>
      </div>
    </section>
  );
}
function MathLine({ s }: { s: string }) {
  return (
    <div
      className="math"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(s, {
          throwOnError: false,
          displayMode: true,
        }),
      }}
    />
  );
}
export function Info({
  intuition,
  model,
  takeaway,
  derivation,
}: {
  intuition: string;
  model: string;
  takeaway: string;
  derivation: string[];
}) {
  return (
    <details className="learning-block">
      <summary>
        Learn the physics <span>+</span>
      </summary>
      <p className="takeaway">
        <span>Takeaway</span>
        {takeaway}
      </p>
      <div className="derivation">
        <div className="info-grid">
          <div>
            <span>Physical intuition</span>
            <p>{intuition}</p>
          </div>
          <div>
            <span>Model</span>
            <p>{model}</p>
          </div>
        </div>
        {derivation.map((equation, index) => (
          <MathLine key={index} s={equation} />
        ))}
      </div>
    </details>
  );
}
export function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  const highlighted = useChangeHighlight(value);
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={highlighted ? 'number-updated' : undefined}>{value}</strong>
      <small>{unit}</small>
    </div>
  );
}
export function Metrics({ children }: { children: React.ReactNode }) {
  return <div className="metrics">{children}</div>;
}
function ChipGroup({
  items,
  value,
  set,
}: {
  items: {
    value: string;
    label: string;
  }[];
  value: string;
  set: (s: string) => void;
}) {
  return (
    <div className="chips">
      {items.map((i) => (
        <button
          key={i.value}
          aria-pressed={value === i.value}
          className={value === i.value ? 'active' : ''}
          onClick={() => set(i.value)}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="error-box" role="alert">
      {error instanceof Error ? error.message : String(error)} Adjust the controls below or reset to
      restore the model.
    </div>
  );
}
export function useParams(initial: Record<string, number>) {
  const [v, setV] = useState(initial);
  return {
    v,
    set: (key: string, value: number) =>
      setV((old) => ({
        ...old,
        [key]: value,
      })),
    reset: () => setV(initial),
  };
}
const dopControls: Control[] = [
  {
    key: 'NA0',
    label: 'Surface acceptors',
    min: 1e15,
    max: 1e19,
    step: 1e14,
    unit: 'cm⁻³',
    log: true,
  },
  {
    key: 'ND',
    label: 'Donors',
    min: 1e14,
    max: 1e18,
    step: 1e13,
    unit: 'cm⁻³',
    log: true,
  },
  {
    key: 'L',
    label: 'Diffusion length',
    min: 0.1,
    max: 3,
    step: 0.01,
    unit: 'µm',
  },
];
export function Doping() {
  const [log, setLog] = useState(true);
  const { v, set, reset } = useParams({
    NA0: 1e18,
    ND: 1e16,
    L: 1,
  });
  const curves = true,
    junction = true;
  const controls = (
    <Controls
      values={v}
      set={set}
      items={dopControls}
      reset={() => {
        reset();
        setLog(true);
      }}
    >
      <Toggle label="Logarithmic concentration axis" checked={log} onChange={setLog} />
    </Controls>
  );
  try {
    const xj = P.junctionPosition(v.NA0, v.ND, v.L),
      max = 5,
      jd = xj >= 0 && xj <= max;
    const a = pts(0, max, 120, (x) => P.doping(v.NA0, v.ND, v.L, x).NA),
      d = pts(0, max, 120, () => v.ND),
      net = pts(0, max, 120, (x) => P.doping(v.NA0, v.ND, v.L, x).net / 1e18);
    const transform = (arr: [number, number][]) =>
      arr.map(([x, y]) => [x, log ? Math.log10(y) : y / 1e18] as [number, number]);
    const low = log ? Math.floor(Math.log10(Math.min(v.ND, v.NA0 * Math.exp(-max / v.L)))) : 0,
      high = log
        ? Math.ceil(Math.log10(Math.max(v.NA0, v.ND)))
        : (Math.max(v.NA0, v.ND) / 1e18) * 1.05;
    return (
      <DemoLayout
        calculation={
          <Calculation
            formula="x_j=L\ln\left(\frac{N_{A0}}{N_D}\right)"
            substitution={String.raw`${fmt(v.L, 2)}\,\mu\mathrm m\cdot\ln\left(\frac{${texSci(v.NA0)}}{${texSci(v.ND)}}\right)=${fmt(xj, 2)}\,\mu\mathrm m`}
          />
        }
        controls={controls}
      >
        <Metrics>
          <Metric
            label="Metallurgical junction"
            value={jd ? fmt(xj, 2) : 'Outside bar'}
            unit={jd ? 'µm' : ''}
          />
          <Metric label="P-type length" value={fmt(Math.max(0, Math.min(max, xj)), 2)} unit="µm" />
          <Metric
            label="N-type length"
            value={fmt(max - Math.max(0, Math.min(max, xj)), 2)}
            unit="µm"
          />
        </Metrics>
        <div className="silicon-bar">
          <div
            style={{
              width: `${(100 * Math.max(0, Math.min(max, xj))) / max}%`,
            }}
            className="pbar"
          >
            P-TYPE
          </div>
          <div className="nbar">N-TYPE</div>
        </div>
        <div className="graph-grid">
          <Plot
            title="Individual doping concentrations"
            points={[
              {
                x: 0,
                y: log ? Math.log10(v.NA0) : v.NA0 / 1e18,
                label: `NA(0) ${sci(v.NA0)} cm⁻³`,
                color: orange,
                dx: 12,
                dy: 18,
              },
              {
                x: 0,
                y: log ? Math.log10(v.ND) : v.ND / 1e18,
                label: `ND ${sci(v.ND)} cm⁻³`,
                color: blue,
                dx: 12,
                dy: -9,
              },
            ]}
            yLabel={log ? 'log₁₀ concentration (cm⁻³)' : 'Concentration (10¹⁸ cm⁻³)'}
            series={
              curves
                ? [
                    {
                      name: 'Nₐ',
                      color: orange,
                      points: transform(a),
                    },
                    {
                      name: 'Nᴅ',
                      color: blue,
                      points: transform(d),
                    },
                  ]
                : []
            }
            xDomain={[0, max]}
            yDomain={[low, high]}
            markers={
              junction && jd
                ? [
                    {
                      x: xj,
                      label: `Junction ${fmt(xj, 2)} µm`,
                    },
                  ]
                : []
            }
            onInspect={(x) => {
              const r = P.doping(v.NA0, v.ND, v.L, x);
              return `Nₐ ${sci(r.NA)} · Nᴅ ${sci(r.ND)} cm⁻³`;
            }}
          />
          <Plot
            title="Net dopant concentration"
            yLabel="Nᴅ − Nₐ (10¹⁸ cm⁻³)"
            series={[
              {
                name: 'Nᴅ − Nₐ',
                color: purple,
                points: net,
              },
            ]}
            xDomain={[0, max]}
            yDomain={[(-v.NA0 / 1e18) * 1.05, Math.max(v.ND / 1e18, 0.05)]}
            zones={[
              {
                from: 0,
                to: Math.max(0, Math.min(max, xj)),
                color: orange,
              },
              {
                from: Math.max(0, Math.min(max, xj)),
                to: max,
                color: blue,
              },
            ]}
            markers={
              junction && jd
                ? [
                    {
                      x: xj,
                      label: 'Junction',
                    },
                  ]
                : []
            }
            onInspect={(x) => {
              const r = P.doping(v.NA0, v.ND, v.L, x);
              return `Net ${sci(r.net)} cm⁻³ · ${r.type}`;
            }}
          />
        </div>
      </DemoLayout>
    );
  } catch (e) {
    return (
      <DemoLayout controls={controls}>
        <ErrorBox error={e} />
      </DemoLayout>
    );
  }
}
export function DemoLayout({
  controls,
  calculation,
  children,
}: {
  controls: React.ReactNode;
  calculation?: React.ReactNode;
  children: React.ReactNode;
}) {
  const inlineControls = useContext(InlineControlsContext);
  return (
    <div className="demo-layout">
      {inlineControls && controls}
      <div className="demo-main">{children}</div>
      {calculation}
      {!inlineControls && controls}
    </div>
  );
}
const pnControls: Control[] = [
  {
    key: 'NA',
    label: 'P-side acceptors',
    min: 1e15,
    max: 5e17,
    step: 1e14,
    unit: 'cm⁻³',
    log: true,
  },
  {
    key: 'ND',
    label: 'N-side donors',
    min: 1e15,
    max: 5e17,
    step: 1e14,
    unit: 'cm⁻³',
    log: true,
  },
  {
    key: 'VA',
    label: 'Applied voltage',
    min: -2,
    max: 0.7,
    step: 0.01,
    unit: 'V',
  },
  {
    key: 'T',
    label: 'Temperature',
    min: 200,
    max: 450,
    step: 1,
    unit: 'K',
  },
];
const pnModelFormulas = [
  {
    label: 'Built-in voltage and depletion drop',
    formula: String.raw`\begin{aligned}V_{bi}&=V_T\ln\!\left(\frac{N_AN_D}{n_i^2}\right)\\V_{dep}&=V_{bi}-V_A,\qquad V_A<V_{bi}\end{aligned}`,
  },
  {
    label: 'Depletion width',
    formula: String.raw`W=\sqrt{\frac{2\varepsilon_s}{q}\left(\frac1{N_A}+\frac1{N_D}\right)(V_{bi}-V_A)}`,
  },
  {
    label: 'Charge balance and side widths',
    formula: String.raw`\begin{aligned}N_Ax_p&=N_Dx_n,\qquad W=x_p+x_n\\x_p&=\frac{N_D}{N_A+N_D}W,\quad x_n=\frac{N_A}{N_A+N_D}W\end{aligned}`,
  },
  {
    label: 'Electric field and potential',
    formula: String.raw`\begin{aligned}\frac{d\mathcal E}{dx}&=\frac{\rho}{\varepsilon_s},\qquad \mathcal E=-\frac{dV}{dx}\\|\mathcal E|_{max}&=\frac{qN_Ax_p}{\varepsilon_s}=\frac{qN_Dx_n}{\varepsilon_s}\end{aligned}`,
  },
];

function PNModelLimitPlot({ NA, ND, T, VA }: { NA: number; ND: number; T: number; VA: number }) {
  const vbi = P.builtIn(NA, ND, T);
  const minBias = -2,
    maxBias = Math.max(0.7, vbi + 0.25);
  const widthFactor = Math.sqrt(((2 * P.epsSi) / P.q) * (1 / NA + 1 / ND));
  // Sample only up to the zero-width mathematical limit, never beyond it.
  const widths = pts(minBias, vbi, 180, (bias) =>
    P.um(widthFactor * Math.sqrt(Math.max(0, vbi - bias))),
  );
  const selectedWidth = VA < vbi ? P.um(P.pnDepletion(NA, ND, T, VA).W) : null;
  return (
    <Plot
      title="Depletion model limit"
      xLabel="Applied voltage (V)"
      yLabel="Depletion width (µm)"
      xDomain={[minBias, maxBias]}
      yDomain={[0, widths[0][1] * 1.12]}
      zones={[{ from: vbi, to: maxBias, color: '#c4493e' }]}
      markers={[
        { x: vbi, label: 'Vbi: model limit ' + fmt(vbi, 3) + ' V' },
        { x: VA, label: 'Selected bias ' + fmt(VA, 3) + ' V' },
      ]}
      points={
        selectedWidth === null
          ? []
          : [{ x: VA, y: selectedWidth, label: 'W ' + fmt(selectedWidth, 3) + ' µm', color: blue }]
      }
      series={[
        { name: 'Total W', color: blue, points: widths },
        {
          name: 'P-side xₚ',
          color: orange,
          points: widths.map(([bias, width]) => [bias, (width * ND) / (NA + ND)]),
        },
        {
          name: 'N-side xₙ',
          color: green,
          points: widths.map(([bias, width]) => [bias, (width * NA) / (NA + ND)]),
        },
      ]}
      onInspect={(bias) =>
        bias >= vbi
          ? 'Shaded region: no valid depletion-width solution'
          : 'W ' +
            fmt(P.um(P.pnDepletion(NA, ND, T, bias).W), 3) +
            ' µm · Vbi − VA ' +
            fmt(vbi - bias, 3) +
            ' V'
      }
    />
  );
}

const pnModelNote = (
  <p className="pn-model-note">
    The shaded region begins at Vₐ = Vbi, where the depletion-width formula has no valid solution.
    The approximation becomes less accurate near this limit. The model assumes an abrupt,
    one-dimensional junction with fully ionized dopants and negligible mobile charge in depletion.
  </p>
);

export function PNDepletion() {
  const { v, set, reset } = useParams({
    NA: 1e17,
    ND: 1e16,
    VA: 0,
    T: 300,
  });
  const car = true,
    ions = true,
    animate = false;
  try {
    const d = P.pnDepletion(v.NA, v.ND, v.T, v.VA),
      a = -d.xp * 1.35,
      b = d.xn * 1.35;
    const nondegenerate =
      P.fermiOffset('p', v.NA, v.T).boltzmannValid && P.fermiOffset('n', v.ND, v.T).boltzmannValid;
    const f = (x: number) => P.pnFields(x, v.NA, v.ND, v.T, v.VA);
    const xpts = pts(a, b, 240, (x) => x);
    const conv = (fn: (x: number) => number) =>
      xpts.map(([x]) => [P.um(x), fn(x)] as [number, number]);
    return (
      <DemoLayout
        calculation={
          <Calculation
            title="PN junction formulas"
            forms={pnModelFormulas}
            substitution={String.raw`10^4\sqrt{\frac{2(${texSci(P.epsSi)})}{${texSci(P.q)}}\left(\frac1{${texSci(v.NA)}}+\frac1{${texSci(v.ND)}}\right)(${fmt(d.vbi)}-${fmt(v.VA)})}=${fmt(P.um(d.W), 3)}\,\mu\mathrm m`}
          />
        }
        controls={<Controls values={v} set={set} items={pnControls} reset={reset}></Controls>}
      >
        <Metrics>
          <Metric label="Total width W" value={fmt(P.um(d.W), 3)} unit="µm" />
          <Metric label="P-side xₚ" value={fmt(P.um(d.xp), 3)} unit="µm" />
          <Metric label="N-side xₙ" value={fmt(P.um(d.xn), 3)} unit="µm" />
          <Metric label="Peak |E|" value={sci(d.Emax)} unit="V/cm" />
          <Metric label="Built-in V" value={fmt(d.vbi)} unit="V" />
        </Metrics>
        {!nondegenerate && (
          <div className="notice">
            One side is within 3kT of a band edge. The Boltzmann built-in voltage and
            depletion-width estimate are outside their assumed range.
          </div>
        )}
        <div className={`junction-bar ${animate ? 'animating' : ''}`}>
          <div className="p-half">P REGION {car && <span className="carriers">○ ○ ○ ○</span>}</div>
          <div
            className="depletion-slice"
            style={{
              left: `${(100 * (-d.xp - a)) / (b - a)}%`,
              width: `${(100 * d.W) / (b - a)}%`,
            }}
          >
            {ions && <span>− − − │ + + +</span>}
            <small>DEPLETION</small>
          </div>
          <div className="n-half">{car && <span className="carriers">• • • •</span>} N REGION</div>
        </div>
        <div className="graph-grid pn-graph-grid">
          <Plot
            title="Space charge density"
            points={[
              {
                x: -P.um(d.xp) / 2,
                y: -P.q * v.NA,
                label: `ρp ${sci(-P.q * v.NA)} C/cm³`,
                color: orange,
                dx: -12,
                dy: -10,
              },
              {
                x: P.um(d.xn) / 2,
                y: P.q * v.ND,
                label: `ρn ${sci(P.q * v.ND)} C/cm³`,
                color: blue,
                dx: 12,
                dy: 18,
              },
            ]}
            yLabel="ρ (C/cm³)"
            xDomain={[P.um(a), P.um(b)]}
            yDomain={[-v.NA * P.q * 1.1, v.ND * P.q * 1.1]}
            series={[
              {
                name: 'ρ(x)',
                color: orange,
                points: conv((x) => f(x).rho),
              },
            ]}
            markers={[
              {
                x: 0,
                label: 'Junction',
              },
            ]}
          />
          <Plot
            title="Electric field"
            points={[
              {
                x: 0,
                y: -d.Emax,
                label: `|E|max ${sci(d.Emax)} V/cm`,
                color: blue,
                dx: 12,
                dy: -10,
              },
            ]}
            spans={[
              {
                from: -P.um(d.xp),
                to: P.um(d.xn),
                y: d.Emax * 0.04,
                label: `W ${fmt(P.um(d.W), 3)} µm`,
              },
            ]}
            yLabel="E (V/cm)"
            xDomain={[P.um(a), P.um(b)]}
            yDomain={[-d.Emax * 1.1, d.Emax * 0.1]}
            series={[
              {
                name: 'E(x)',
                color: blue,
                points: conv((x) => f(x).E),
              },
            ]}
          />
          <Plot
            title="Electrostatic potential"
            brackets={[
              {
                x: P.um(b) * 0.86,
                from: 0,
                to: d.drop,
                label: `Drop ${fmt(d.drop, 3)} V`,
                color: green,
                side: 'left',
              },
              {
                x: P.um(a) * 0.8,
                from: 0,
                to: d.vbi,
                label: `Vbi(eq) ${fmt(d.vbi, 3)} V`,
                color: '#77838b',
                dashed: true,
              },
            ]}
            yLabel="V (V)"
            xDomain={[P.um(a), P.um(b)]}
            yDomain={[0, Math.max(d.drop, d.vbi) * 1.1]}
            series={[
              {
                name: 'V(x)',
                color: green,
                points: conv((x) => f(x).V),
              },
            ]}
          />
          <PNModelLimitPlot NA={v.NA} ND={v.ND} T={v.T} VA={v.VA} />
        </div>
        {pnModelNote}
      </DemoLayout>
    );
  } catch (e) {
    return (
      <DemoLayout
        controls={<Controls values={v} set={set} items={pnControls} reset={reset} />}
        calculation={
          <Calculation
            title="PN junction formulas"
            forms={pnModelFormulas}
            substitution={String.raw`\text{No valid depletion solution at the selected bias.}`}
          />
        }
      >
        <div className="graph-grid pn-graph-grid">
          {['Space charge density', 'Electric field', 'Electrostatic potential'].map((title) => (
            <div className="plot-card" key={title}>
              <div className="plot-title">
                <b>{title}</b>
              </div>
              <ErrorBox error={e} />
            </div>
          ))}
          <PNModelLimitPlot NA={v.NA} ND={v.ND} T={v.T} VA={v.VA} />
        </div>
        {pnModelNote}
      </DemoLayout>
    );
  }
}
function Band({
  title,
  ec,
  ev,
  ef = 0,
  ei,
  xDomain = [-1, 1],
  markers = [],
  brackets = [],
  points = [],
  spans = [],
}: {
  title: string;
  ec: [number, number][];
  ev: [number, number][];
  ef?: number;
  ei?: [number, number][];
  xDomain?: [number, number];
  markers?: {
    x: number;
    label: string;
  }[];
  brackets?: EnergyBracket[];
  points?: PointLabel[];
  spans?: SpanLabel[];
}) {
  const all = [...ec, ...ev].map((p) => p[1]);
  return (
    <Plot
      title={title}
      xLabel="Position (relative)"
      yLabel="Energy (eV)"
      xDomain={xDomain}
      yDomain={[Math.min(...all, ef) - 0.12, Math.max(...all, ef) + 0.12]}
      markers={markers}
      brackets={brackets}
      points={points}
      spans={spans}
      series={[
        {
          name: 'Eᴄ',
          color: blue,
          points: ec,
        },
        {
          name: 'Eᴠ',
          color: green,
          points: ev,
        },
        ...(ei
          ? [
              {
                name: 'Eᵢ',
                color: yellow,
                points: ei,
                dash: true,
              },
            ]
          : []),
        {
          name: 'Eꜰ',
          color: purple,
          points: [
            [xDomain[0], ef],
            [xDomain[1], ef],
          ],
        },
      ]}
      onInspect={(x) => `Eᴄ ${fmt(sample(ec, x))} · Eᴠ ${fmt(sample(ev, x))} · Eꜰ ${fmt(ef)} eV`}
    />
  );
}
const bandControls: Control[] = [
  {
    key: 'NA',
    label: 'Acceptor density',
    min: 1e15,
    max: 5e17,
    step: 1e14,
    unit: 'cm⁻³',
    log: true,
  },
  {
    key: 'ND',
    label: 'Donor density',
    min: 1e15,
    max: 5e17,
    step: 1e14,
    unit: 'cm⁻³',
    log: true,
  },
  {
    key: 'T',
    label: 'Temperature',
    min: 200,
    max: 450,
    step: 1,
    unit: 'K',
  },
];
export function BuiltIn() {
  const { v, set, reset } = useParams({
    NA: 1e17,
    ND: 1e16,
    T: 300,
  });
  const [contact, C] = useState(true);
  const controls = (
    <Controls values={v} set={set} items={bandControls} reset={reset}>
      <Toggle label="After contact / equilibrium" checked={contact} onChange={C} />
    </Controls>
  );
  try {
    const V = P.builtIn(v.NA, v.ND, v.T),
      Eg = P.bandgap(v.T),
      kT = P.thermalVoltage(v.T),
      ni = P.ni(v.T),
      eiShift = P.intrinsicMidgapOffset(v.T);
    const nondegenerate =
      P.fermiOffset('p', v.NA, v.T).boltzmannValid && P.fermiOffset('n', v.ND, v.T).boltzmannValid;
    const left = kT * Math.log(v.NA / ni),
      right = kT * Math.log(v.ND / ni);
    const bend = pts(
      -1,
      1,
      120,
      (x) => (V * (Math.tanh(3) - Math.tanh(x * 3))) / (2 * Math.tanh(3)),
    );
    const ec = bend.map(([x, y]) => [x, y + Eg / 2 - eiShift - right] as [number, number]),
      ev = ec.map(([x, y]) => [x, y - Eg] as [number, number]),
      ei = ec.map(([x, y]) => [x, y - Eg / 2 + eiShift] as [number, number]);
    return (
      <DemoLayout
        calculation={
          <Calculation
            formula="V_{bi}=V_T\ln\left(\frac{N_AN_D}{n_i^2}\right)"
            substitution={String.raw`${fmt(kT, 4)}\ln\left(\frac{(${texSci(v.NA)})(${texSci(v.ND)})}{(${texSci(ni)})^2}\right)=${fmt(V, 3)}\,\mathrm V`}
          />
        }
        controls={controls}
      >
        <Metrics>
          <Metric label="Built-in potential" value={fmt(V)} unit="V" />
          <Metric label="Thermal voltage" value={fmt(kT, 4)} unit="V" />
          <Metric label="Intrinsic density" value={sci(ni)} unit="cm⁻³" />
          <Metric label="Bandgap" value={fmt(Eg)} unit="eV" />
        </Metrics>
        {!nondegenerate && (
          <div className="notice">
            One side is within 3kT of a band edge. This Boltzmann built-in voltage is outside its
            assumed range; see the degenerate-junction demo.
          </div>
        )}
        {contact ? (
          <Band
            title="Equilibrium PN energy bands"
            brackets={[
              {
                x: -0.58,
                from: ec[0][1],
                to: ec[ec.length - 1][1],
                guideFromX: -1,
                guideToX: 1,
                label: `qVbi ${fmt(V, 3)} eV`,
                color: purple,
              },
              {
                x: 0.72,
                from: sample(ec, 0.72),
                to: sample(ev, 0.72),
                label: `Eg ${fmt(Eg, 3)} eV`,
                color: green,
                side: 'left',
              },
            ]}
            ec={ec}
            ev={ev}
            ei={ei}
          />
        ) : (
          <div className="graph-grid">
            <Band
              title="Separate p-type bulk"
              brackets={[
                { x: 0, from: 0, to: left, label: `Ei−EF ${fmt(left, 3)} eV`, color: purple },
              ]}
              ec={[
                [-1, Eg / 2 - eiShift + left],
                [1, Eg / 2 - eiShift + left],
              ]}
              ev={[
                [-1, -Eg / 2 - eiShift + left],
                [1, -Eg / 2 - eiShift + left],
              ]}
              ei={[
                [-1, left],
                [1, left],
              ]}
            />
            <Band
              title="Separate n-type bulk"
              brackets={[
                { x: 0, from: 0, to: -right, label: `EF−Ei ${fmt(right, 3)} eV`, color: purple },
              ]}
              ec={[
                [-1, Eg / 2 - eiShift - right],
                [1, Eg / 2 - eiShift - right],
              ]}
              ev={[
                [-1, -Eg / 2 - eiShift - right],
                [1, -Eg / 2 - eiShift - right],
              ]}
              ei={[
                [-1, -right],
                [1, -right],
              ]}
            />
          </div>
        )}
      </DemoLayout>
    );
  } catch (e) {
    return (
      <DemoLayout controls={controls}>
        <ErrorBox error={e} />
      </DemoLayout>
    );
  }
}

export function DegenerateJunctions() {
  const { v, set, reset } = useParams({
    N: 1e17,
    Eg: 1.12,
    T: 300,
  });
  const [mode, M] = useState('pn');
  const controls = (
    <Controls
      values={v}
      set={set}
      items={[
        {
          key: 'N',
          label: 'Nondegenerate-side doping',
          min: 1e15,
          max: 1e19,
          step: 1e14,
          unit: 'cm⁻³',
          log: true,
        },
        {
          key: 'Eg',
          label: 'Bandgap',
          min: 0.8,
          max: 1.5,
          step: 0.001,
          unit: 'eV',
        },
        {
          key: 'T',
          label: 'Temperature',
          min: 200,
          max: 450,
          step: 1,
          unit: 'K',
        },
      ]}
      reset={reset}
    >
      <ChipGroup
        items={[
          {
            value: 'pn',
            label: 'Ordinary PN',
          },
          {
            value: 'p+n',
            label: 'P⁺N',
          },
          {
            value: 'n+p',
            label: 'N⁺P',
          },
        ]}
        value={mode}
        set={M}
      />
    </Controls>
  );
  try {
    const kT = P.thermalVoltage(v.T),
      ni = Math.sqrt(P.Nc(v.T) * P.Nv(v.T)) * Math.exp(-v.Eg / (2 * kT));
    const ordinary = kT * Math.log((v.N * v.N) / ni ** 2);
    const approx = v.Eg / 2 + kT * Math.log(v.N / ni);
    const V = mode === 'pn' ? ordinary : approx;
    const ec = pts(
        -1,
        1,
        100,
        (x) => v.Eg / 2 + (V * (Math.tanh(3) - Math.tanh(x * 3))) / (2 * Math.tanh(3)),
      ),
      ev = ec.map(([x, y]) => [x, y - v.Eg] as [number, number]);
    return (
      <DemoLayout
        calculation={
          <Calculation
            formula={
              mode === 'pn'
                ? String.raw`V_{bi}=V_T\ln(N^2/n_i^2)`
                : String.raw`qV_{bi}\approx E_G/2+kT\ln(N/n_i)`
            }
            substitution={
              mode === 'pn'
                ? String.raw`${fmt(kT, 4)}\ln\left(\frac{(${texSci(v.N)})^2}{(${texSci(ni)})^2}\right)=${fmt(V, 3)}\,\mathrm V`
                : String.raw`${fmt(v.Eg, 3)}/2+${fmt(kT, 4)}\ln\left(\frac{${texSci(v.N)}}{${texSci(ni)}}\right)=${fmt(V, 3)}\,\mathrm{eV}`
            }
          />
        }
        controls={controls}
      >
        <Metrics>
          <Metric label="Built-in voltage" value={fmt(V, 3)} unit="V" />
          <Metric label="Model" value={mode === 'pn' ? 'Boltzmann' : 'Band-edge approximation'} />
        </Metrics>
        {!P.fermiOffset('p', v.N, v.T).boltzmannValid && (
          <div className="notice">
            The selected nondegenerate-side doping is within 3kT of a band edge. The Boltzmann or
            band-edge formula shown here is outside its assumed range; reduce the light-side
            concentration to stay within the approximation.
          </div>
        )}
        <Band
          title="Junction energy-band comparison"
          brackets={[
            {
              x: -0.55,
              from: ec[0][1],
              to: ec[ec.length - 1][1],
              guideFromX: -1,
              guideToX: 1,
              label: `qVbi ${fmt(V, 3)} eV`,
              color: purple,
            },
          ]}
          ec={ec}
          ev={ev}
        />
        {mode !== 'pn' && (
          <div className="notice">
            Approximation: intrinsic level at midgap and heavily doped-side Fermi level exactly at
            the band edge. Arbitrary degenerate doping needs Fermi–Dirac statistics.
          </div>
        )}
      </DemoLayout>
    );
  } catch (e) {
    return (
      <DemoLayout controls={controls}>
        <ErrorBox error={e} />
      </DemoLayout>
    );
  }
}
function SchottkyBand({
  title,
  phi,
  drop,
  vbi,
  width,
  VA,
  T = 300,
  p = false,
}: {
  title: string;
  phi: number;
  drop: number;
  vbi: number;
  width: number;
  VA: number;
  T?: number;
  p?: boolean;
}) {
  const Eg = P.bandgap(T);
  const W = P.um(width);
  const right = 1.18 * W;
  const interfaceEc = p ? Eg - phi - VA : phi - VA;
  const bend = pts(0, right, 120, (x) => {
    const u = Math.min(x / W, 1);
    return (drop * (Math.exp(-5 * u) - Math.exp(-5))) / (1 - Math.exp(-5));
  });
  const ec = bend.map(
      ([x, y]) => [x, p ? interfaceEc + drop - y : interfaceEc - drop + y] as [number, number],
    ),
    ev = ec.map(([x, y]) => [x, y - Eg] as [number, number]);
  const all = [...ec, ...ev].map((d) => d[1]);
  const interfaceBand = p ? interfaceEc - Eg : interfaceEc;
  const bulkBand = interfaceBand + (p ? drop : -drop);
  const equilibriumReference = interfaceBand + (p ? vbi : -vbi);
  const low = Math.min(...all, -VA, 0, equilibriumReference) - 0.23;
  const high = Math.max(...all, -VA, 0, equilibriumReference) + 0.23;
  return (
    <Plot
      title={title}
      height={300}
      xLabel="Distance from interface (µm)"
      yLabel="Energy (eV)"
      xDomain={[-0.35 * W, right]}
      yDomain={[low, high]}
      markers={[
        {
          x: 0,
          label: 'Interface',
        },
      ]}
      series={[
        {
          name: 'Eᴄ',
          color: blue,
          points: ec,
        },
        {
          name: 'Eᴠ',
          color: green,
          points: ev,
        },
        {
          name: 'Metal Eꜰ',
          color: purple,
          points: [
            [-0.35 * W, -VA],
            [0, -VA],
          ],
        },
        {
          name: 'Semiconductor Eꜰ',
          color: yellow,
          points: [
            [0, 0],
            [right, 0],
          ],
        },
      ]}
      brackets={[
        {
          x: -0.21 * W,
          from: -VA,
          to: interfaceBand,
          guideToX: 0,
          label: `${p ? 'ΦBp' : 'ΦBn'} ${fmt(phi, 3)} eV`,
          labelDy: -10,
        },
        {
          x: 0.12 * W,
          from: 0,
          to: interfaceBand,
          guideToX: 0,
          label: `${p ? 'Hole' : 'Electron'} from Eꜰ ${fmt(phi + (p ? VA : -VA), 3)} eV`,
          labelDy: 12,
        },
        {
          x: 0.54 * W,
          from: interfaceBand,
          to: bulkBand,
          guideFromX: 0,
          guideToX: W,
          side: 'left',
          label: `Drop ${fmt(drop, 3)} V`,
          color: blue,
          labelDy: 14,
        },
        {
          x: 0.91 * W,
          from: interfaceBand,
          to: equilibriumReference,
          guideFromX: 0,
          side: 'left',
          dashed: true,
          label: `Vbi(eq) ${fmt(vbi, 3)} V`,
          color: '#747f89',
          labelDy: -14,
        },
      ]}
      spans={[{ from: 0, to: W, y: low + 0.12, label: `W ${fmt(W, 3)} µm`, color: '#446a77' }]}
      onInspect={(x) =>
        x < 0 ? `Metal Eꜰ ${fmt(-VA)} eV` : `Eᴄ ${fmt(sample(ec, x))} · Eᴠ ${fmt(sample(ev, x))} eV`
      }
    />
  );
}
const schControls: Control[] = [
  {
    key: 'ND',
    label: 'Donor density',
    min: 1e15,
    max: 5e17,
    step: 1e14,
    unit: 'cm⁻³',
    log: true,
  },
  {
    key: 'phiM',
    label: 'Metal work function',
    min: 4,
    max: 5.6,
    step: 0.01,
    unit: 'eV',
  },
  {
    key: 'chi',
    label: 'Electron affinity',
    min: 3.8,
    max: 4.3,
    step: 0.01,
    unit: 'eV',
  },
  {
    key: 'phiEmp',
    label: 'Empirical barrier',
    min: 0.35,
    max: 1,
    step: 0.01,
    unit: 'eV',
  },
  {
    key: 'VA',
    label: 'Applied voltage',
    min: -2,
    max: 0.6,
    step: 0.01,
    unit: 'V',
  },
  {
    key: 'T',
    label: 'Temperature',
    min: 200,
    max: 450,
    step: 1,
    unit: 'K',
  },
];
export function Schottky() {
  const { v, set, reset } = useParams({
    ND: 1e17,
    phiM: 4.65,
    chi: 4.05,
    phiEmp: 0.65,
    VA: 0,
    T: 300,
  });
  const [mode, M] = useState('empirical');
  const [metal, setMetal] = useState('NiSi');
  const controls = (
    <Controls
      values={v}
      set={set}
      items={schControls.filter((control) =>
        mode === 'ideal'
          ? ['ND', 'phiM', 'chi', 'VA'].includes(control.key)
          : ['ND', 'phiEmp', 'VA'].includes(control.key),
      )}
      reset={() => {
        reset();
        M('empirical');
        setMetal('NiSi');
      }}
    >
      <label className="select-label">
        Contact material
        <select
          value={metal}
          onChange={(e) => {
            const selected = e.target.value;
            setMetal(selected);
            set('phiM', selected === 'W' ? 4.6 : selected === 'Pt' ? 5.6 : 4.65);
            set('phiEmp', selected === 'W' ? 0.67 : selected === 'Pt' ? 0.73 : 0.65);
          }}
        >
          <option value="NiSi">NiSi / Si</option>
          <option value="W">W / Si</option>
          <option value="Pt">Pt / Si</option>
        </select>
      </label>
      <ChipGroup
        items={[
          { value: 'empirical', label: 'Tabulated barrier' },
          { value: 'ideal', label: 'Ideal Schottky–Mott' },
        ]}
        value={mode}
        set={M}
      />
    </Controls>
  );
  try {
    const phi = mode === 'ideal' ? v.phiM - v.chi : v.phiEmp,
      d = P.schottky(phi, v.ND, v.T, v.VA);
    return (
      <DemoLayout
        calculation={
          <Calculation
            formula="V_{bi}=\Phi_{Bn}-V_T\ln\left(\frac{N_C}{N_D}\right)"
            substitution={String.raw`${fmt(phi, 3)}-${fmt(P.thermalVoltage(v.T), 4)}\ln\left(\frac{${texSci(P.Nc(v.T))}}{${texSci(v.ND)}}\right)=${fmt(d.vbi, 3)}\,\mathrm V`}
          />
        }
        controls={controls}
      >
        <Metrics>
          <Metric label="Metal work function ΦM" value={fmt(v.phiM)} unit="eV" />
          <Metric label="Electron affinity χ" value={fmt(v.chi)} unit="eV" />
          <Metric label="Electron barrier ΦBn" value={fmt(phi)} unit="eV" />
          <Metric label="Built-in potential" value={fmt(d.vbi)} unit="V" />
          <Metric label="Depletion drop" value={fmt(d.drop)} unit="V" />
          <Metric
            label="Effective electron barrier"
            value={fmt(phi - v.VA)}
            unit="eV from semiconductor Eꜰ"
          />
          <Metric label="Depletion width" value={fmt(P.um(d.W), 3)} unit="µm" />
        </Metrics>
        <SchottkyBand
          title="Metal / n-Si energy bands"
          phi={phi}
          drop={d.drop}
          vbi={d.vbi}
          width={d.W}
          VA={v.VA}
          T={v.T}
        />
      </DemoLayout>
    );
  } catch (e) {
    return (
      <DemoLayout controls={controls}>
        <ErrorBox error={e} />
      </DemoLayout>
    );
  }
}
export function SchottkyBias() {
  const { v, set, reset } = useParams({
    phiN: 0.65,
    phiP: 0.47,
  });
  const [selected, S] = useState([true, false, false, false]);
  const cases = [
    {
      name: 'NiSi / n-Si · equilibrium',
      VA: 0,
      p: false,
    },
    {
      name: 'NiSi / n-Si · reverse',
      VA: -1,
      p: false,
    },
    {
      name: 'NiSi / n-Si · forward',
      VA: 0.2,
      p: false,
    },
    {
      name: 'NiSi / p-Si · equilibrium',
      VA: 0,
      p: true,
    },
  ];
  const rows = cases.map((c, i) => {
    try {
      const d = c.p
        ? P.schottkyP(v.phiP, 1e17, 300, 12 * 8.85e-14)
        : P.schottky(v.phiN, 1e17, 300, c.VA, 12 * 8.85e-14);
      return {
        ...c,
        index: i,
        phi: c.p ? v.phiP : v.phiN,
        ...d,
      };
    } catch (e) {
      return {
        ...c,
        index: i,
        phi: c.p ? v.phiP : v.phiN,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
  const firstSelected = rows.find((r) => selected[r.index] && !('error' in r));
  return (
    <DemoLayout
      calculation={
        <Calculation
          title={
            firstSelected
              ? String.raw`Case ${firstSelected.index + 1} calculation`
              : 'Case calculation'
          }
          formula={
            firstSelected?.p
              ? String.raw`W_p=\sqrt{2\varepsilon_sV_{bi,p}/(qN_A)}`
              : String.raw`W_n=\sqrt{2\varepsilon_s(V_{bi}-V_A)/(qN_D)}`
          }
          substitution={
            firstSelected && !('error' in firstSelected)
              ? String.raw`10^4\sqrt{\frac{2(${texSci(12 * 8.85e-14)})(${fmt(firstSelected.drop, 3)})}{(${texSci(P.q)})(${texSci(1e17)})}}=${fmt(P.um(firstSelected.W), 3)}\,\mu\mathrm m`
              : String.raw`\text{Select a valid case}`
          }
        />
      }
      controls={
        <Controls
          values={v}
          set={set}
          items={[
            {
              key: 'phiN',
              label: 'NiSi / n-Si reference barrier',
              min: 0.4,
              max: 0.9,
              step: 0.01,
              unit: 'eV',
            },
            {
              key: 'phiP',
              label: 'NiSi / p-Si reference barrier',
              min: 0.2,
              max: 0.8,
              step: 0.01,
              unit: 'eV',
            },
          ]}
          reset={reset}
        >
          <div className="case-select">
            {cases.map((_c, i) => (
              <Toggle
                key={i}
                label={`Case ${i + 1}`}
                checked={selected[i]}
                onChange={(checked) => S((old) => old.map((x, j) => (j === i ? checked : x)))}
              />
            ))}
          </div>
        </Controls>
      }
    >
      <div className="graph-grid schottky-case-grid">
        {rows
          .filter((r) => selected[r.index])
          .map((r) =>
            'error' in r ? (
              <ErrorBox key={r.index} error={r.error} />
            ) : (
              <SchottkyBand
                key={r.index}
                title={r.name}
                phi={r.phi}
                drop={r.drop}
                vbi={r.vbi}
                width={r.W}
                VA={r.VA}
                p={r.p}
              />
            ),
          )}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Case</th>
              <th>Vₐ (V)</th>
              <th>Barrier (eV)</th>
              <th>Vbi (V)</th>
              <th>Drop (V)</th>
              <th>W (µm)</th>
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((r) => selected[r.index])
              .map((r) => (
                <tr key={r.index}>
                  <td>{r.name}</td>
                  <td>{r.VA}</td>
                  <td>{fmt(r.phi)}</td>
                  <td>{'error' in r ? '—' : fmt(r.vbi)}</td>
                  <td>{'error' in r ? '—' : fmt(r.drop)}</td>
                  <td>{'error' in r ? '—' : fmt(P.um(r.W))}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </DemoLayout>
  );
}
export function Capacitance() {
  const { v, set, reset } = useParams({
    ND: 1e17,
    A: 1e-4,
    vbi: 0.6,
    VA: -0.5,
    eps: 12,
  });
  const controls = (
    <Controls
      values={v}
      set={set}
      items={[
        {
          key: 'ND',
          label: 'Donor density',
          min: 1e15,
          max: 1e19,
          step: 1e14,
          unit: 'cm⁻³',
          log: true,
        },
        {
          key: 'A',
          label: 'Junction area',
          min: 1e-6,
          max: 1e-2,
          step: 1e-6,
          unit: 'cm²',
          log: true,
        },
        {
          key: 'VA',
          label: 'Applied voltage',
          min: -3,
          max: 0.55,
          step: 0.01,
          unit: 'V',
        },
        {
          key: 'vbi',
          label: 'Built-in voltage',
          min: 0.2,
          max: 1,
          step: 0.01,
          unit: 'V',
        },
        {
          key: 'eps',
          label: 'Relative permittivity',
          min: 8,
          max: 16,
          step: 0.1,
          unit: 'ε₀',
        },
      ].filter((control) => control.key !== 'eps')}
      reset={reset}
    >
      <div className="notice small">
        Depletion capacitance only. Diffusion capacitance and strong forward bias are excluded.
      </div>
    </Controls>
  );
  try {
    const epsilon = v.eps * P.eps0,
      now = P.capacitance(v.ND, v.A, v.vbi, v.VA, epsilon);
    const max = Math.min(v.vbi - 0.02, 0.55),
      min = -3,
      xs = pts(min, max, 150, (x) => x);
    const width = xs.map(
      ([x]) => [x, P.um(P.capacitance(v.ND, v.A, v.vbi, x, epsilon).W)] as [number, number],
    );
    const caps = xs.map(
      ([x]) => [x, P.capacitance(v.ND, v.A, v.vbi, x, epsilon).C * 1e12] as [number, number],
    );
    const inv = xs.map(
      ([x]) => [x, P.capacitance(v.ND, v.A, v.vbi, x, epsilon).invC2 / 1e24] as [number, number],
    );
    return (
      <DemoLayout
        calculation={
          <Calculation
            formula="C_j=\frac{\varepsilon_sA}{W}"
            substitution={String.raw`\frac{(${texSci(epsilon)})(${texSci(v.A)})}{${texSci(now.W)}}=${texSci(now.C)}\,\mathrm F=${fmt(now.C * 1e12, 2)}\,\mathrm{pF}`}
          />
        }
        controls={controls}
      >
        <Metrics>
          <Metric label="Depletion width" value={fmt(P.um(now.W), 3)} unit="µm" />
          <Metric label="Junction capacitance" value={fmt(now.C * 1e12, 2)} unit="pF" />
          <Metric label="1/C² slope" value={sci(now.slope)} unit="F⁻²/V" />
          <Metric label="Voltage intercept" value={fmt(now.intercept)} unit="V" />
        </Metrics>
        <div className="graph-grid three">
          <Plot
            title="Depletion width"
            points={[
              {
                x: v.VA,
                y: P.um(now.W),
                label: `W ${fmt(P.um(now.W), 3)} µm`,
                color: blue,
                dx: 12,
                dy: -10,
              },
            ]}
            xLabel="Applied voltage (V)"
            yLabel="W (µm)"
            xDomain={[min, max]}
            yDomain={[0, width[0][1] * 1.1]}
            series={[
              {
                name: 'W',
                color: blue,
                points: width,
              },
            ]}
            markers={[
              {
                x: v.VA,
                label: 'Selected bias',
              },
            ]}
          />
          <Plot
            title="Junction capacitance"
            points={[
              {
                x: v.VA,
                y: now.C * 1e12,
                label: `C ${fmt(now.C * 1e12, 2)} pF`,
                color: green,
                dx: 12,
                dy: -10,
              },
            ]}
            xLabel="Applied voltage (V)"
            yLabel="C (pF)"
            xDomain={[min, max]}
            yDomain={[0, caps[caps.length - 1][1] * 1.1]}
            series={[
              {
                name: 'C',
                color: green,
                points: caps,
              },
            ]}
            markers={[
              {
                x: v.VA,
                label: 'Selected bias',
              },
            ]}
          />
          <Plot
            title="Inverse capacitance squared"
            points={[
              {
                x: v.VA,
                y: now.invC2 / 1e24,
                label: `1/C² ${fmt(now.invC2 / 1e24, 2)} ×10²⁴ F⁻²`,
                color: orange,
                dx: 12,
                dy: -10,
              },
              {
                x: (min + max) / 2,
                y: P.capacitance(v.ND, v.A, v.vbi, (min + max) / 2, epsilon).invC2 / 1e24,
                label: `Slope ${sci(now.slope)} F⁻²/V`,
                color: orange,
                dx: -12,
                dy: 15,
              },
            ]}
            xLabel="Applied voltage (V)"
            yLabel="1/C² (10²⁴ F⁻²)"
            xDomain={[min, v.vbi]}
            yDomain={[0, inv[0][1] * 1.1]}
            series={[
              {
                name: '1/C²',
                color: orange,
                points: [...inv, [v.vbi, 0]],
              },
            ]}
            markers={[
              {
                x: v.vbi,
                label: 'Vbi intercept',
              },
            ]}
          />
        </div>
      </DemoLayout>
    );
  } catch (e) {
    return (
      <DemoLayout controls={controls}>
        <ErrorBox error={e} />
      </DemoLayout>
    );
  }
}
