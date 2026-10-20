# Semiconductor Physics Lab

An interactive Next.js laboratory of semiconductor simulations. The source uses TypeScript, React, Tailwind CSS, D3 scales and paths, KaTeX, and Lucide icons. Physics calculations use cm, F/cm, V, eV, K, and cm⁻³, with explicit SI conversions for WKB tunneling.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Run the equation tests with `npm test`. `npm run build` creates a static export in `out/`.

## Model boundaries

- `/avalanche-breakdown` animates electron-triggered impact ionization in a prescribed uniform field. The graph uses electron-only single-pass gain; hole feedback, screening, heating, and circuit loading are omitted. Animation playback is illustrative slow motion with a 160-carrier display limit. Pause, step, click to inject, and adjust voltage/width/speed.
- `/zener-breakdown` animates incident, evanescent, reflected, and transmitted electron-wave components. Its triangular-barrier WKB estimate uses a 1.12 eV gap and illustrative reduced mass of 0.08m₀, with an available final state required at the selected energy. It is not a self-consistent doped-junction or calibrated current model. Wave splitting depicts probability amplitudes across repeated trials. Adjust the voltage drop and width, launch packets, pause, and step.

- PN depletion and Schottky widths use the depletion approximation. Inputs outside that regime display an error instead of silently clipping the result.
- The PN diode I–V adds an illustrative exponential reverse-breakdown knee to the ideal injection current. Breakdown voltage and knee scale are adjustable, with a fixed 1 mA/cm² current scale. They are independent of doping; series resistance, heating, and breakdown-generated carrier densities are excluded. The carrier plot retains the ideal injection model.
- Degenerate carrier positions use a numerical Fermi–Dirac integral. The simplified P⁺N and N⁺P expressions assume a midgap intrinsic level and a Fermi level at the heavy-side band edge.
- Schottky C–V excludes diffusion capacitance, image-force lowering, interface-state dispersion, and strong-forward-bias effects.
- The NiSi/n-Si 0.67 eV teaching reference is based on a [measured barrier-height result](https://doi.org/10.1016/S0038-1101(03)00286-7). The adjustable p-Si reference is 0.45 eV, as reported in a [p-type measurement](https://avesis.uludag.edu.tr/yayin/c1235786-676b-42d1-acf7-6ceafb248039/temperature-dependent-electrical-behavior-of-nickel-silicide-schottky-diodes-on-p-type-silicon). These need not add to one exact silicon bandgap because they come from distinct physical interfaces and measurement conditions.
