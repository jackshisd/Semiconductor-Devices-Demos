'use client';

import { useState } from 'react';
import { Controls } from './Controls';
import { DemoLayout, fmt, Metric, Metrics, useParams } from './Demos';
import { solarCollection } from '../lib/opto-structures';

export default function SolarCellStructure() {
  const { v, set, reset } = useParams({ absorptionDepthMicrons: 35, diffusionLengthMicrons: 60 });
  const [coating, setCoating] = useState(true);
  const state = solarCollection({
    absorptionDepthMicrons: v.absorptionDepthMicrons,
    diffusionLengthMicrons: v.diffusionLengthMicrons,
    antiReflectionCoating: coating,
  });
  const junctionY = 160;
  const pairY = junctionY + (v.absorptionDepthMicrons / 120) * 190;
  const electronCollected = v.absorptionDepthMicrons <= v.diffusionLengthMicrons;
  return (
    <DemoLayout
      controls={
        <Controls
          values={v}
          set={set}
          reset={() => {
            reset();
            setCoating(true);
          }}
          items={[
            {
              key: 'absorptionDepthMicrons',
              label: 'Absorption depth below junction',
              min: 0,
              max: 120,
              step: 1,
              unit: 'µm',
            },
            {
              key: 'diffusionLengthMicrons',
              label: 'Minority-electron diffusion length',
              min: 10,
              max: 120,
              step: 1,
              unit: 'µm',
            },
          ]}
        >
          <div className="chips" role="group" aria-label="Antireflection coating">
            <button
              type="button"
              className={coating ? 'active' : undefined}
              aria-pressed={coating}
              onClick={() => setCoating(true)}
            >
              Coating on
            </button>
            <button
              type="button"
              className={!coating ? 'active' : undefined}
              aria-pressed={!coating}
              onClick={() => setCoating(false)}
            >
              Coating off
            </button>
          </div>
        </Controls>
      }
    >
      <p className="carrier-motion-summary">
        Trace light through the textured top contact into the silicon. The thin n emitter and p base
        form a junction that separates generated carriers; a minority electron created deeper in the
        p base has farther to diffuse back to the junction before recombining.
      </p>
      <div className="opto-diagram-frame">
        <svg
          viewBox="0 0 640 440"
          role="img"
          aria-label={`Solar-cell cross section with antireflection coating ${coating ? 'on' : 'off'}, electron-hole pair ${fmt(v.absorptionDepthMicrons, 0)} micrometers below the junction, and electron diffusion length ${fmt(v.diffusionLengthMicrons, 0)} micrometers.`}
        >
          <defs>
            <marker
              id="solar-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10Z" fill="#234f75" />
            </marker>
            <marker
              id="solar-photon-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10Z" fill="#e4a934" />
            </marker>
          </defs>
          <rect x="64" y="93" width="466" height="67" fill="#8bd9df" />
          <path
            d="M64 93 L98 78 L132 93 L166 78 L200 93 L234 78 L268 93 L302 78 L336 93 L370 78 L404 93 L438 78 L472 93 L506 78 L530 93"
            fill="none"
            stroke={coating ? '#e8c92e' : '#83a0a9'}
            strokeWidth="9"
            strokeLinejoin="round"
          />
          <rect x="64" y="160" width="466" height="200" fill="#a578af" />
          <rect x="64" y="360" width="466" height="20" fill="#aab2b9" />
          <rect x="111" y="65" width="35" height="35" fill="#737d88" />
          <rect x="456" y="65" width="35" height="35" fill="#737d88" />
          <path d="M128 65V40H473V65" fill="none" stroke="#485463" strokeWidth="3" />
          <path d="M473 40h47v95" fill="none" stroke="#485463" strokeWidth="3" />
          <path
            d="M520 135v33m0 0-12 15 24 18-24 18 24 18-24 18 12 15v91H320"
            fill="none"
            stroke="#485463"
            strokeWidth="3"
          />
          <text x="338" y="51" fill="#435360" fontSize="14">
            front contact / load
          </text>
          <text x="538" y="222" fill="#435360" fontSize="13">
            load
          </text>
          <text x="76" y="133" fill="#17637b" fontWeight="700" fontSize="18">
            n emitter
          </text>
          <text x="78" y="247" fill="#fff" fontWeight="700" fontSize="21">
            p base
          </text>
          <text x="75" y="376" fill="#445361" fontWeight="700" fontSize="12">
            rear aluminum contact
          </text>
          <text x="72" y="69" fill="#8b7330" fontSize="12">
            {coating ? 'textured antireflection layer' : 'uncoated textured surface'}
          </text>
          {[190, 254, 318, 382].map((x) => (
            <path
              key={x}
              d={`M${x} 20v48`}
              stroke="#e4a934"
              strokeWidth="3"
              markerEnd="url(#solar-photon-arrow)"
            />
          ))}
          <path
            d={`M318 96V${pairY - 13}`}
            stroke="#e4a934"
            strokeWidth="2"
            strokeDasharray="5 4"
            markerEnd="url(#solar-photon-arrow)"
          />
          <circle cx="318" cy={pairY} r="18" fill="#fff6d0" stroke="#e6b43a" strokeWidth="2" />
          <text
            x="318"
            y={pairY + 5}
            textAnchor="middle"
            fill="#76551c"
            fontWeight="700"
            fontSize="15"
          >
            e⁻/h⁺
          </text>
          <path
            d={`M302 ${pairY - 12} C270 ${pairY - 30}, 266 200, 280 166`}
            fill="none"
            stroke={electronCollected ? '#234f75' : '#8091a0'}
            strokeWidth="3"
            strokeDasharray={electronCollected ? undefined : '5 5'}
            markerEnd="url(#solar-arrow)"
          />
          <path
            d={`M336 ${pairY + 10} Q375 ${Math.min(pairY + 31, 353)} 415 355`}
            fill="none"
            stroke="#bf566b"
            strokeWidth="3"
            markerEnd="url(#solar-arrow)"
          />
          <text x="350" y={Math.min(pairY + 40, 343)} fill="#fff" fontSize="13">
            hole → rear
          </text>
          <text x="224" y="153" fill="#234f75" fontWeight="700" fontSize="13">
            electron → junction
          </text>
          <text x="64" y="414" fill="#4e5963" fontSize="13">
            Electron collection factor: exp(−d/Lₙ) = {fmt(state.minorityCollectionFraction, 2)}
          </text>
        </svg>
      </div>
      <Metrics>
        <Metric
          label="Surface transmission"
          value={fmt(state.opticalTransmission * 100, 0)}
          unit="% illustrative"
        />
        <Metric
          label="Electron collection factor"
          value={fmt(state.minorityCollectionFraction * 100, 1)}
          unit="%"
        />
        <Metric
          label="Combined illustrative fraction"
          value={fmt(state.illustrativeCollectedFraction * 100, 1)}
          unit="%"
        />
      </Metrics>
      <p className="carrier-motion-summary" role="status">
        {electronCollected
          ? 'The selected pair lies within one diffusion length of the junction, so its minority electron is comparatively likely to be collected.'
          : 'The selected pair lies beyond one diffusion length. Recombination becomes more likely before its minority electron reaches the junction.'}{' '}
        The dashed or solid path illustrates the trend; collection is probabilistic, not a hard
        cutoff.
      </p>
      <p className="carrier-motion-summary">
        The optical transmission values are illustrative. The exponential factor models
        minority-carrier survival in a simple long-base approximation; a real solar cell also
        depends on absorption wavelength, surface recombination, fields, and contact losses.
      </p>
    </DemoLayout>
  );
}
