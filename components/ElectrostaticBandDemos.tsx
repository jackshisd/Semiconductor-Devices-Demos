'use client';

import { useEffect, useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, Metric, Metrics, fmt, useParams } from './Demos';

const wrap = (value: number, length: number) => ((value % length) + length) % length;

function useDriftPhase(voltage: number) {
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      if (media.matches) setRunning(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!running || voltage === 0) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!document.hidden) setPhase((old) => old + dt * 85 * Math.abs(voltage));
    }, 33);
    return () => window.clearInterval(timer);
  }, [running, voltage]);
  return { phase, setPhase, running, setRunning };
}

export function ElectrostaticPotential() {
  const { v, set, reset } = useParams({ voltage: 0.7 });
  const { phase, setPhase, running, setRunning } = useDriftPhase(v.voltage);
  const field = v.voltage * 1000; // Illustrative 10 µm silicon length, expressed in V/cm.
  const direction = Math.sign(v.voltage);
  const potentialY = (potential: number) => 350 - potential * 65;
  const bandY = (energy: number) => 430 - (energy + 1.5) * 45;
  const ecLeft = 1.12 - v.voltage;
  const evLeft = -v.voltage;
  const electronXs = [175, 370, 565].map((x) => 145 + wrap(x - 145 - direction * phase, 610));
  const holeXs = [245, 440, 635].map((x) => 145 + wrap(x - 145 + direction * phase, 610));
  const fieldText = direction > 0 ? 'right' : direction < 0 ? 'left' : 'zero';
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setPhase(0);
            setRunning(true);
          }}
          items={[
            {
              key: 'voltage',
              label: 'Left contact voltage',
              min: -1.2,
              max: 1.2,
              step: 0.05,
              unit: 'V',
            },
          ]}
        >
          <div className="breakdown-playback">
            <button className="breakdown-action" onClick={() => setRunning((old) => !old)}>
              {running ? 'Pause motion' : 'Play motion'}
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Potential, electric field, and band edges"
          formula={String.raw`V(x)=V_L\left(1-\frac{x}{L}\right),\quad \mathcal E=-\frac{dV}{dx}=\frac{V_L}{L},\quad E_C(x)=E_{C,0}-qV(x)`}
          substitution={String.raw`V_L=${fmt(v.voltage, 2)}\,\mathrm V,\quad L=10\,\mu\mathrm m,\quad \mathcal E=${fmt(field, 0)}\,\mathrm{V/cm}`}
        />
      }
    >
      <Metrics>
        <Metric label="Left contact" value={fmt(v.voltage, 2)} unit="V relative to right" />
        <Metric label="Electric field" value={fmt(field, 0)} unit="V/cm" />
        <Metric label="Field direction" value={fieldText} />
        <Metric label="Silicon band gap" value="1.12" unit="eV, constant" />
      </Metrics>
      <section className="plot-card electrostatic-scene">
        <div className="teaching-scene-head">
          <div>
            <span className="eyebrow">LECTURE 2 · SLIDE 13</span>
            <h2>Voltage tilts the potential and the energy bands</h2>
          </div>
        </div>
        <div className="teaching-scene-scroll">
          <svg
            viewBox="0 0 900 480"
            role="img"
            aria-label={`Left contact ${fmt(v.voltage, 2)} volts. Electric field ${fieldText}. Electrons drift ${direction > 0 ? 'left' : direction < 0 ? 'right' : 'nowhere on average'} and holes drift ${direction > 0 ? 'right' : direction < 0 ? 'left' : 'nowhere on average'}.`}
          >
            <rect x="125" y="73" width="650" height="120" rx="12" fill="#eef6fa" stroke="#b9d5e0" />
            <text x="125" y="43" className="teaching-svg-title">
              {v.voltage >= 0 ? '+' : '−'} {fmt(Math.abs(v.voltage), 2)} V
            </text>
            <text x="775" y="43" textAnchor="end" className="teaching-svg-title">
              0 V
            </text>
            <text x="450" y="66" textAnchor="middle" className="teaching-svg-small">
              Silicon · 10 µm
            </text>
            <text x="145" y="110" className="teaching-svg-small">
              Conduction electrons
            </text>
            <text x="145" y="175" className="teaching-svg-small">
              Valence holes
            </text>
            {electronXs.map((x, i) => (
              <g key={`e-${i}`}>
                <circle cx={x} cy="132" r="13" fill="#237da5" />
                <text x={x} y="138" textAnchor="middle" fill="white" fontSize="17">
                  −
                </text>
              </g>
            ))}
            {holeXs.map((x, i) => (
              <g key={`h-${i}`}>
                <circle cx={x} cy="165" r="13" fill="#d47845" />
                <text x={x} y="171" textAnchor="middle" fill="white" fontSize="17">
                  +
                </text>
              </g>
            ))}
            <text x="450" y="218" textAnchor="middle" className="teaching-svg-small">
              {direction === 0
                ? 'No field: no net drift'
                : `Field ${direction > 0 ? '→' : '←'}  ·  electrons ${direction > 0 ? '←' : '→'}  ·  holes ${direction > 0 ? '→' : '←'}`}
            </text>
            <text x="120" y="257" className="teaching-svg-title">
              Electrostatic potential V(x)
            </text>
            <line x1="130" y1="350" x2="425" y2="350" stroke="#aabcc5" strokeWidth="1.5" />
            <line x1="130" y1="270" x2="130" y2="430" stroke="#aabcc5" strokeWidth="1.5" />
            <text x="119" y="354" textAnchor="end" className="teaching-svg-small">
              0
            </text>
            <line
              x1="130"
              y1={potentialY(v.voltage)}
              x2="425"
              y2={potentialY(0)}
              stroke="#25a1c7"
              strokeWidth="4"
            />
            <circle cx="130" cy={potentialY(v.voltage)} r="5" fill="#25a1c7" />
            <text x="130" y="453" className="teaching-svg-small">
              left
            </text>
            <text x="425" y="453" textAnchor="end" className="teaching-svg-small">
              right
            </text>
            <text x="510" y="257" className="teaching-svg-title">
              Band edges E₍C₎ and E₍V₎
            </text>
            <path
              d={`M 555 ${bandY(ecLeft)} L 845 ${bandY(1.12)} L 845 ${bandY(0)} L 555 ${bandY(evLeft)} Z`}
              fill="#f3f0fa"
            />
            <line
              x1="555"
              y1={bandY(ecLeft)}
              x2="845"
              y2={bandY(1.12)}
              stroke="#357896"
              strokeWidth="4"
            />
            <line
              x1="555"
              y1={bandY(evLeft)}
              x2="845"
              y2={bandY(0)}
              stroke="#c37845"
              strokeWidth="4"
            />
            <text x="850" y={bandY(1.12) + 5} className="teaching-svg-small">
              Ec
            </text>
            <text x="850" y={bandY(0) + 5} className="teaching-svg-small">
              Ev
            </text>
            <text x="700" y="453" textAnchor="middle" className="teaching-svg-small">
              Constant gap Eg = 1.12 eV
            </text>
          </svg>
        </div>
        <p className="teaching-caption">
          The carriers’ motion is slowed for visibility. Its speed is schematic; the field and band
          slopes follow the shown 10 µm model.
        </p>
      </section>
    </DemoLayout>
  );
}

export function MaterialBandComparison() {
  const { v, set, reset } = useParams({ voltage: 0.7, T: 300 });
  const { phase, setPhase, running, setRunning } = useDriftPhase(v.voltage);
  const direction = Math.sign(v.voltage);
  const siliconPairs = 2 + Math.round((v.T - 200) / 200);
  const carrierX = (left: number, index: number, count: number, sign: number) =>
    left + 35 + wrap((index * 215) / count + sign * direction * phase, 215);
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setPhase(0);
            setRunning(true);
          }}
          items={[
            {
              key: 'voltage',
              label: 'Applied voltage',
              min: -1.2,
              max: 1.2,
              step: 0.05,
              unit: 'V',
            },
            { key: 'T', label: 'Temperature', min: 200, max: 600, step: 10, unit: 'K' },
          ]}
        >
          <div className="breakdown-playback">
            <button className="breakdown-action" onClick={() => setRunning((old) => !old)}>
              {running ? 'Pause motion' : 'Play motion'}
            </button>
          </div>
        </Controls>
      }
    >
      <Metrics>
        <Metric label="SiO₂ band gap" value="≈9" unit="eV · insulating" />
        <Metric label="Silicon band gap" value="1.12" unit="eV · semiconducting" />
        <Metric label="Metal band gap" value="0" unit="eV · partially filled band" />
        <Metric label="Applied voltage" value={fmt(v.voltage, 2)} unit="V" />
      </Metrics>
      <section className="plot-card electrostatic-scene">
        <div className="teaching-scene-head">
          <div>
            <span className="eyebrow">LECTURE 2 · SLIDE 16</span>
            <h2>Band gap controls which carriers can move</h2>
          </div>
        </div>
        <div className="teaching-scene-scroll">
          <svg
            viewBox="0 0 960 365"
            role="img"
            aria-label={`Comparison at ${fmt(v.T, 0)} kelvin and ${fmt(v.voltage, 2)} volts: silicon dioxide has a large gap and no mobile carriers shown; silicon has a small gap and mobile electrons and holes; metal has a partially filled band and many mobile electrons.`}
          >
            {[
              { left: 25, title: 'Silicon dioxide · insulator', gap: 'Eg ≈ 9 eV', fill: '#f2f4f5' },
              { left: 340, title: 'Silicon · semiconductor', gap: 'Eg = 1.12 eV', fill: '#eef6fa' },
              { left: 655, title: 'Metal · conductor', gap: 'Eg = 0', fill: '#f4f0fa' },
            ].map((item, index) => (
              <g key={item.title}>
                <rect
                  x={item.left}
                  y="18"
                  width="280"
                  height="329"
                  rx="12"
                  fill={item.fill}
                  stroke="#d7e1e5"
                />
                <text x={item.left + 140} y="46" textAnchor="middle" className="teaching-svg-title">
                  {item.title}
                </text>
                <text x={item.left + 140} y="67" textAnchor="middle" className="teaching-svg-small">
                  {item.gap}
                </text>
                {index === 0 ? (
                  <>
                    <line
                      x1={item.left + 35}
                      x2={item.left + 245}
                      y1="95"
                      y2="95"
                      stroke="#357896"
                      strokeWidth="4"
                    />
                    <line
                      x1={item.left + 35}
                      x2={item.left + 245}
                      y1="190"
                      y2="190"
                      stroke="#c37845"
                      strokeWidth="4"
                    />
                    <text x={item.left + 250} y="99" className="teaching-svg-small">
                      Ec
                    </text>
                    <text x={item.left + 250} y="194" className="teaching-svg-small">
                      Ev
                    </text>
                    <text
                      x={item.left + 140}
                      y="152"
                      textAnchor="middle"
                      className="teaching-svg-small"
                    >
                      Large forbidden gap
                    </text>
                  </>
                ) : index === 1 ? (
                  <>
                    <line
                      x1={item.left + 35}
                      x2={item.left + 245}
                      y1="125"
                      y2="125"
                      stroke="#357896"
                      strokeWidth="4"
                    />
                    <line
                      x1={item.left + 35}
                      x2={item.left + 245}
                      y1="166"
                      y2="166"
                      stroke="#c37845"
                      strokeWidth="4"
                    />
                    <text x={item.left + 250} y="129" className="teaching-svg-small">
                      Ec
                    </text>
                    <text x={item.left + 250} y="170" className="teaching-svg-small">
                      Ev
                    </text>
                    <circle cx={item.left + 126} cy="117" r="8" fill="#237da5" />
                    <circle
                      cx={item.left + 126}
                      cy="174"
                      r="8"
                      fill="none"
                      stroke="#d47845"
                      strokeWidth="3"
                    />
                  </>
                ) : (
                  <>
                    <rect x={item.left + 35} y="113" width="210" height="65" fill="#dcd3ef" />
                    <line
                      x1={item.left + 35}
                      x2={item.left + 245}
                      y1="113"
                      y2="113"
                      stroke="#6d58a8"
                      strokeWidth="4"
                    />
                    <line
                      x1={item.left + 35}
                      x2={item.left + 245}
                      y1="145"
                      y2="145"
                      stroke="#6d58a8"
                      strokeWidth="2"
                      strokeDasharray="5 4"
                    />
                    <text
                      x={item.left + 140}
                      y="102"
                      textAnchor="middle"
                      className="teaching-svg-small"
                    >
                      Partially filled band
                    </text>
                  </>
                )}
                <line x1={item.left + 25} x2={item.left + 255} y1="222" y2="222" stroke="#c8d5da" />
              </g>
            ))}
            <text x="165" y="269" textAnchor="middle" className="teaching-svg-small">
              No mobile carriers shown
            </text>
            {Array.from({ length: siliconPairs }, (_, i) => (
              <g key={`silicon-${i}`}>
                <circle cx={carrierX(340, i, siliconPairs, -1)} cy="259" r="9" fill="#237da5" />
                <circle cx={carrierX(340, i, siliconPairs, 1)} cy="291" r="9" fill="#d47845" />
              </g>
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <circle
                key={`metal-${i}`}
                cx={carrierX(655, i, 7, -1)}
                cy={i % 2 ? 263 : 290}
                r="8"
                fill="#6d58a8"
              />
            ))}
            <text x="480" y="324" textAnchor="middle" className="teaching-svg-small">
              Blue: electron · orange: hole
            </text>
            <text x="795" y="324" textAnchor="middle" className="teaching-svg-small">
              Purple: mobile electron
            </text>
          </svg>
        </div>
        <p className="teaching-caption">
          Voltage reverses the drift direction; at 0 V there is no net drift. Raising temperature
          makes more electron–hole pairs visible in silicon. Dot counts and speeds are schematic,
          not carrier concentrations or measured mobilities.
        </p>
      </section>
    </DemoLayout>
  );
}
