'use client';

import { useEffect, useId, useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, useParams } from './Demos';
import { chargeControlRates, chargeControlStep } from '../lib/charge-control';

export default function LongBaseChargeControl() {
  const { v, set, reset } = useParams({ inlet: 12, tau: 3 });
  const [charge, setCharge] = useState(0);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const clipId = useId().replace(/:/g, '');
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = 0;
    const tick = (now: number) => {
      if (previous && now - previous >= 30) {
        const elapsed = Math.min((now - previous) / 1000, 0.1);
        setCharge((old) => chargeControlStep(old, v.inlet, v.tau, elapsed));
        setPhase((old) => old + elapsed);
        previous = now;
      } else if (!previous) previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, v.inlet, v.tau]);
  const rates = chargeControlRates(charge, v.inlet, v.tau);
  const rateScale = Math.max(
    25,
    Math.ceil(Math.max(rates.inletMicroA, rates.recombinationMicroA) / 5) * 5,
  );
  const editSnapshot = (key: 'inlet' | 'tau', value: number) => {
    setPlaying(false);
    set(key, value);
  };
  const editCharge = (value: number) => {
    setPlaying(false);
    setCharge(value);
  };
  const waterTop = 375 - Math.min(1, charge / 125) * 240;
  const wave = 3 * Math.sin(phase * 3);
  const inletDrops = Array.from({ length: 4 }, (_, index) => ({
    x: 360 + 3 * Math.sin(index * 2.7),
    y: 66 + ((phase * (38 + v.inlet * 2) + index * 30) % 120),
  }));
  const drainDrops = Array.from({ length: 3 }, (_, index) => ({
    x: 360 + 3 * Math.sin(index * 2.3),
    y: 368 + ((phase * (15 + rates.recombinationMicroA * 3) + index * 16) % 48),
  }));
  const resetAll = () => {
    reset();
    setCharge(0);
    setPhase(0);
    setPlaying(true);
  };
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={resetAll}
          items={[
            {
              key: 'inlet',
              label: 'Hole injection current',
              min: 0,
              max: 25,
              step: 0.5,
              unit: 'µA',
            },
            {
              key: 'tau',
              label: 'Recombination lifetime',
              min: 0.5,
              max: 5,
              step: 0.1,
              unit: 'µs',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Charge-control actions">
            <button type="button" onClick={() => setPlaying((old) => !old)}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" onClick={() => set('inlet', v.inlet === 0 ? 12 : 0)}>
              {v.inlet === 0 ? 'Turn inlet on' : 'Shut inlet off'}
            </button>
            <button type="button" onClick={() => setCharge(0)}>
              Empty beaker
            </button>
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="Long-base charge-control derivation"
          forms={[
            {
              label: 'Integrate hole continuity over the n-type neutral region',
              formula: String.raw`\frac{dQ_p}{dt}=A J_p(x_n)-A J_p(\infty)-\frac{Q_p}{\tau_p}`,
            },
            {
              label: 'The long-base boundary has no far-end hole current',
              formula: String.raw`J_p(\infty)=0\quad\Rightarrow\quad\frac{dQ_p}{dt}=I_p(x_n)-\frac{Q_p}{\tau_p}`,
            },
          ]}
          substitution={String.raw`I_p(x_n)=${fmt(v.inlet, 1)}\,\mu\mathrm A,\quad\tau_p=${fmt(v.tau, 1)}\,\mu\mathrm s,\quad Q_{p,\mathrm{steady}}=${fmt(rates.steadyChargePc, 1)}\,\mathrm{pC}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        The beaker stands for the long n-type neutral region. Dripping water represents holes
        diffusing in at the depletion edge; the drain represents recombination throughout the base.
      </p>
      <section className="charge-beaker-card" aria-label="Animated long-base beaker analogy">
        <div className="charge-beaker-readouts" aria-live="off">
          <div>
            <span>Holes entering</span>
            <strong>{fmt(rates.inletMicroA, 1)} µA</strong>
          </div>
          <div>
            <span>Stored excess charge</span>
            <strong>{fmt(charge, 2)} pC</strong>
          </div>
          <div>
            <span>Recombination loss</span>
            <strong>{fmt(rates.recombinationMicroA, 2)} µA</strong>
          </div>
          <div>
            <span>Rate of change</span>
            <strong>
              {rates.netMicroA >= 0 ? '+' : ''}
              {fmt(rates.netMicroA, 2)} pC/µs
            </strong>
          </div>
        </div>
        <svg
          className="charge-beaker-svg"
          viewBox="0 0 720 440"
          role="img"
          aria-label={`Beaker contains ${fmt(charge, 1)} picocoulombs of excess hole charge. Injection ${fmt(rates.inletMicroA, 1)} microamperes; recombination ${fmt(rates.recombinationMicroA, 1)} microamperes.`}
        >
          <defs>
            <clipPath id={clipId}>
              <path d="M210 123 L230 349 Q233 370 255 370 H465 Q487 370 490 349 L510 123 Z" />
            </clipPath>
          </defs>
          <text x="360" y="24" textAnchor="middle" className="beaker-label">
            Hole diffusion into n-type base
          </text>
          <path
            d="M319 55 H347 Q360 55 360 69 V92"
            fill="none"
            stroke="#d47748"
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d="M319 55 H347 Q360 55 360 69 V92"
            fill="none"
            stroke="#f4b58b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {playing &&
            v.inlet > 0 &&
            inletDrops.map((drop, index) => (
              <path
                key={index}
                d={`M${drop.x} ${drop.y - 8} Q${drop.x - 6} ${drop.y + 2} ${drop.x} ${drop.y + 6} Q${drop.x + 6} ${drop.y + 2} ${drop.x} ${drop.y - 8}`}
                fill="#d47748"
                opacity="0.85"
              />
            ))}
          <path
            d="M209 124 L230 349 Q233 370 255 370 H465 Q487 370 490 349 L511 124"
            fill="#f8fbfc"
            stroke="#527482"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          <g clipPath={`url(#${clipId})`}>
            <path
              d={`M200 ${waterTop} Q280 ${waterTop - wave} 360 ${waterTop} T520 ${waterTop} V380 H200 Z`}
              fill="#9bd4e5"
              opacity="0.82"
            />
            <path
              d={`M200 ${waterTop} Q280 ${waterTop - wave} 360 ${waterTop} T520 ${waterTop}`}
              fill="none"
              stroke="#308bb2"
              strokeWidth="3"
            />
          </g>
          <text x="360" y="305" textAnchor="middle" className="beaker-charge-label">
            Qₚ = {fmt(charge, 1)} pC
          </text>
          <text x="360" y="331" textAnchor="middle" className="beaker-secondary-label">
            excess holes stored
          </text>
          <path
            d="M360 371 V390"
            fill="none"
            stroke="#d47748"
            strokeWidth="7"
            strokeLinecap="round"
          />
          {playing &&
            charge > 0.2 &&
            drainDrops.map((drop, index) => (
              <circle key={index} cx={drop.x} cy={drop.y} r="4" fill="#d47748" opacity="0.8" />
            ))}
          <text x="523" y="208" className="beaker-side-label">
            Long base:
          </text>
          <text x="523" y="230" className="beaker-side-label">
            Jₚ(∞) = 0
          </text>
          <text x="470" y="418" className="beaker-side-label">
            Loss = Qₚ / τₚ
          </text>
        </svg>
        <p className="charge-beaker-equation" aria-live="off">
          {fmt(rates.inletMicroA, 1)} µA entering − {fmt(rates.recombinationMicroA, 2)} µA
          recombining = {rates.netMicroA >= 0 ? '+' : ''}
          {fmt(rates.netMicroA, 2)} pC/µs stored
        </p>
      </section>
      <section className="charge-balance-panel" aria-labelledby="charge-balance-heading">
        <h2 id="charge-balance-heading">See the charge balance numerically</h2>
        <p>
          Set a starting charge, injection current, and lifetime. The beaker pauses while you edit;
          press Play to watch the charge approach its steady level.
        </p>
        <div className="charge-balance-sliders">
          <label>
            <span>
              Injection current Iₚ(xₙ) <strong>{fmt(v.inlet, 1)} µA</strong>
            </span>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={v.inlet}
              onChange={(event) => editSnapshot('inlet', Number(event.target.value))}
            />
          </label>
          <label>
            <span>
              Stored excess-hole charge Qₚ <strong>{fmt(charge, 1)} pC</strong>
            </span>
            <input
              type="range"
              min="0"
              max="125"
              step="0.5"
              value={Math.min(125, charge)}
              onChange={(event) => editCharge(Number(event.target.value))}
            />
          </label>
          <label>
            <span>
              Carrier lifetime τₚ <strong>{fmt(v.tau, 1)} µs</strong>
            </span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={v.tau}
              onChange={(event) => editSnapshot('tau', Number(event.target.value))}
            />
          </label>
        </div>
        <div className="charge-balance-values" aria-live="off">
          <div>
            <span>Injection</span>
            <strong>{fmt(rates.inletMicroA, 2)} µA</strong>
          </div>
          <div>
            <span>Recombination Qₚ/τₚ</span>
            <strong>{fmt(rates.recombinationMicroA, 2)} µA</strong>
          </div>
          <div>
            <span>Accumulation dQₚ/dt</span>
            <strong>
              {rates.netMicroA >= 0 ? '+' : ''}
              {fmt(rates.netMicroA, 2)} pC/µs
            </strong>
          </div>
        </div>
        <div
          className="charge-balance-bars"
          aria-label={`Injection ${fmt(rates.inletMicroA, 2)} microamperes; recombination ${fmt(rates.recombinationMicroA, 2)} microamperes, on a shared ${fmt(rateScale, 0)} microampere scale`}
        >
          <div className="charge-balance-bar-label">
            <span>Holes in</span>
            <span>{fmt(rates.inletMicroA, 2)} µA</span>
          </div>
          <div className="charge-balance-track">
            <span
              className="charge-balance-inlet"
              style={{ width: `${(100 * rates.inletMicroA) / rateScale}%` }}
            />
          </div>
          <div className="charge-balance-bar-label">
            <span>Recombined</span>
            <span>{fmt(rates.recombinationMicroA, 2)} µA</span>
          </div>
          <div className="charge-balance-track">
            <span
              className="charge-balance-loss"
              style={{ width: `${(100 * rates.recombinationMicroA) / rateScale}%` }}
            />
          </div>
          <small>
            Both bars share a {fmt(rateScale, 0)} µA scale. Their difference changes the stored
            charge.
          </small>
        </div>
      </section>
      <p className="teaching-caption">
        A larger lifetime slows the leak and raises the final water level. Shut off the inlet to
        watch stored charge decay. The bottom drain combines recombination occurring across the
        base; it does not represent a physical current leaving at the far end. One second of
        animation represents one microsecond in the model.
      </p>
    </DemoLayout>
  );
}
