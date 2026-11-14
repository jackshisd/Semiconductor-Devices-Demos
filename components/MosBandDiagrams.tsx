'use client';

import { useState } from 'react';
import { Controls } from './Controls';
import { Calculation, DemoLayout, fmt, Metric, Metrics, sci, useParams } from './Demos';

type Substrate = 'p' | 'n';
type Regime = 'Accumulation' | 'Flat band' | 'Depletion' | 'Inversion';

const colors = { ec: '#2672d9', ei: '#ae7b16', ev: '#14875f', ef: '#7654ba' };
const VT = 0.02585;
const NI = 1e10;

function mosState(substrate: Substrate, gate: number, flat: number, doping: number) {
  const polarity = substrate === 'p' ? 1 : -1;
  const drive = polarity * (gate - flat);
  const phiF = VT * Math.log(doping / NI);
  const regime: Regime =
    drive < -0.08
      ? 'Accumulation'
      : drive < 0.08
        ? 'Flat band'
        : drive < 1.2
          ? 'Depletion'
          : 'Inversion';
  // A continuous schematic response: depletion reaches |ψs| ≈ 2φF at inversion.
  const bend =
    drive < 0 ? -0.18 * Math.log1p(-drive / 0.18) : Math.min(2 * phiF, (2 * phiF * drive) / 1.2);
  const psi = polarity * bend;
  return { drive, phiF, regime, psi, oxide: gate - flat - psi };
}

function BandDiagram({
  substrate,
  gate,
  flat,
  psi,
  regime,
  phiF,
}: {
  substrate: Substrate;
  gate: number;
  flat: number;
  psi: number;
  regime: Regime;
  phiF: number;
}) {
  const y = (energy: number) => 222 - energy * 130;
  const fermi = substrate === 'p' ? -phiF : phiF;
  const edge = (energy: number) =>
    Array.from({ length: 37 }, (_, i) => {
      const x = 290 + (480 * i) / 36;
      const bend = -psi * Math.exp(-(x - 290) / 90);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y(energy + bend).toFixed(1)}`;
    }).join(' ');
  const surfaceCarrier =
    regime === 'Accumulation'
      ? substrate === 'p'
        ? 'holes +'
        : 'electrons −'
      : regime === 'Inversion'
        ? substrate === 'p'
          ? 'electrons −'
          : 'holes +'
        : regime === 'Depletion'
          ? substrate === 'p'
            ? 'ionized acceptors −'
            : 'ionized donors +'
          : 'neutral surface';
  return (
    <div
      style={{
        border: '1px solid var(--line, #d8e2e8)',
        borderRadius: 16,
        padding: '0.75rem',
        background: 'var(--surface, #fff)',
      }}
    >
      <svg
        viewBox="0 0 865 460"
        role="img"
        aria-label={`${substrate}-type MOS capacitor in ${regime.toLowerCase()}: silicon conduction, intrinsic, and valence bands bend ${psi > 0.03 ? 'down' : psi < -0.03 ? 'up' : 'very little'} at the oxide interface`}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      >
        <rect x="44" y="25" width="160" height="395" rx="10" fill="#e8edf4" />
        <rect x="204" y="25" width="86" height="395" fill="#fff0d5" />
        <rect x="290" y="25" width="480" height="395" rx="10" fill="#f1f8f5" />
        <path d="M 204 25 V 420 M 290 25 V 420" stroke="#9aadb8" strokeWidth="2" />
        <text x="124" y="48" textAnchor="middle" fill="#344255" fontSize="18" fontWeight="700">
          Gate
        </text>
        <text x="247" y="48" textAnchor="middle" fill="#855b15" fontSize="17" fontWeight="700">
          SiO₂
        </text>
        <text x="530" y="48" textAnchor="middle" fill="#185c43" fontSize="18" fontWeight="700">
          {substrate}-type Si
        </text>
        <text x="124" y="210" textAnchor="middle" fill="#344255" fontSize="19" fontWeight="700">
          {gate > flat + 0.03 ? '+' : gate < flat - 0.03 ? '−' : '0'} gate
        </text>
        <text
          x="247"
          y="230"
          textAnchor="middle"
          fill="#855b15"
          fontSize="15"
          transform="rotate(-90 247 230)"
        >
          wide-gap barrier
        </text>
        <path d={edge(0.56)} stroke={colors.ec} strokeWidth="4" fill="none" />
        <path d={edge(0)} stroke={colors.ei} strokeWidth="2.5" strokeDasharray="7 5" fill="none" />
        <path d={edge(-0.56)} stroke={colors.ev} strokeWidth="4" fill="none" />
        <path
          d={`M 290 ${y(fermi)} H 770`}
          stroke={colors.ef}
          strokeWidth="2.5"
          strokeDasharray="12 6"
        />
        <text x="785" y={y(0.56) + 5} fill={colors.ec} fontSize="17" fontWeight="700">
          E_C
        </text>
        <text x="785" y={y(0) + 5} fill={colors.ei} fontSize="17" fontWeight="700">
          E_i
        </text>
        <text x="785" y={y(-0.56) + 5} fill={colors.ev} fontSize="17" fontWeight="700">
          E_V
        </text>
        <text
          x="785"
          y={y(fermi) + (Math.abs(fermi) < 0.1 ? -8 : 5)}
          fill={colors.ef}
          fontSize="17"
          fontWeight="700"
        >
          E_F
        </text>
        <text x="55" y="446" fill="#526578" fontSize="15">
          Energy ↑
        </text>
        <text x="300" y="446" fill="#526578" fontSize="15">
          Distance into silicon →
        </text>
      </svg>
      <p
        style={{
          margin: '0.4rem 0.5rem 0.1rem',
          fontSize: '0.88rem',
          color: 'var(--muted, #526578)',
        }}
      >
        Surface: {surfaceCarrier}. Silicon bands are on an energy scale; the gate and oxide are a
        schematic stack. E<sub>F</sub> is flat within silicon at equilibrium.
      </p>
    </div>
  );
}

function MosDemo({
  initialSubstrate,
  workFunction,
}: {
  initialSubstrate: Substrate;
  workFunction?: boolean;
}) {
  const [substrate, setSubstrate] = useState<Substrate>(initialSubstrate);
  const initial = {
    gate: workFunction ? 0 : initialSubstrate === 'p' ? 0.65 : -0.65,
    flat: workFunction ? 0.4 : 0,
    doping: 1e16,
  };
  const { v, set, reset } = useParams(initial);
  const state = mosState(substrate, v.gate, v.flat, v.doping);
  const choose = (regime: Regime) => {
    const direction = substrate === 'p' ? 1 : -1;
    const relative = { Accumulation: -1.3, 'Flat band': 0, Depletion: 0.6, Inversion: 1.6 }[regime];
    set('gate', v.flat + direction * relative);
  };
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setSubstrate(initialSubstrate);
          }}
          items={[
            { key: 'gate', label: 'Gate voltage VG', min: -2.5, max: 2.5, step: 0.01, unit: 'V' },
            {
              key: 'flat',
              label: 'Flat-band voltage VFB',
              min: -0.8,
              max: 0.8,
              step: 0.01,
              unit: 'V',
            },
            {
              key: 'doping',
              label: substrate === 'p' ? 'Acceptor density NA' : 'Donor density ND',
              min: 1e14,
              max: 1e18,
              step: 1e13,
              unit: 'cm⁻³',
              log: true,
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Substrate type">
            {(['p', 'n'] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={substrate === type ? 'active' : undefined}
                aria-pressed={substrate === type}
                onClick={() => setSubstrate(type)}
              >
                {type}-type substrate
              </button>
            ))}
          </div>
          <div className="chips" role="group" aria-label="MOS bias presets">
            {(['Accumulation', 'Flat band', 'Depletion', 'Inversion'] as const).map((regime) => (
              <button
                key={regime}
                type="button"
                className={state.regime === regime ? 'active' : undefined}
                aria-pressed={state.regime === regime}
                onClick={() => choose(regime)}
              >
                {regime}
              </button>
            ))}
          </div>
        </Controls>
      }
      calculation={
        <Calculation
          title="MOS voltage and band bending"
          forms={[
            { label: 'Ideal flat-band voltage', formula: String.raw`V_{FB}=(\Phi_M-\Phi_S)/q` },
            { label: 'Voltage partition', formula: String.raw`V_G=V_{FB}+V_{ox}+\psi_s` },
            {
              label: 'Silicon band bending',
              formula: String.raw`E_C(0)-E_C(\infty)=E_V(0)-E_V(\infty)=-q\psi_s`,
            },
            { label: 'Bulk Fermi offset', formula: String.raw`|E_F-E_i|=kT\ln(N/n_i)` },
          ]}
          substitution={String.raw`${fmt(v.gate, 2)}=${fmt(v.flat, 2)}+${fmt(state.oxide, 2)}+${fmt(state.psi, 2)}\quad\mathrm{V}`}
        />
      }
    >
      <p className="carrier-motion-summary">
        {workFunction
          ? 'Change the work-function offset to move flat band away from zero gate voltage. '
          : ''}
        {substrate === 'p'
          ? 'A negative gate attracts holes; a positive gate depletes holes and eventually inverts the surface to electrons.'
          : 'A positive gate attracts electrons; a negative gate depletes electrons and eventually inverts the surface to holes.'}
      </p>
      <Metrics>
        <Metric label="Surface state" value={state.regime} />
        <Metric label="Surface potential ψs" value={fmt(state.psi, 2)} unit="V" />
        <Metric label="Oxide drop Vox" value={fmt(state.oxide, 2)} unit="V" />
        <Metric label="Bulk doping" value={sci(v.doping)} unit="cm⁻³" />
      </Metrics>
      <BandDiagram
        substrate={substrate}
        gate={v.gate}
        flat={v.flat}
        psi={state.psi}
        regime={state.regime}
        phiF={state.phiF}
      />
      <p className="notice">
        The gate-bias to surface-potential response is illustrative; quantitative threshold and
        oxide drop require solving charge balance and Poisson’s equation.
      </p>
    </DemoLayout>
  );
}

export function MosWorkFunction() {
  return <MosDemo initialSubstrate="p" workFunction />;
}
export function MosPTypeBands() {
  return <MosDemo initialSubstrate="p" />;
}
export function MosNTypeBands() {
  return <MosDemo initialSubstrate="n" />;
}
