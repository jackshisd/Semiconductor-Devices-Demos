# Semiconductor Physics Lab

An interactive Next.js laboratory with nine semiconductor simulations. The source uses TypeScript, React, Tailwind CSS, D3 scales and paths, KaTeX, and Lucide icons. All physics calculations use cm, F/cm, V, eV, K, and cm⁻³ internally.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. Run the equation tests with `npm test`. `npm run build` creates a static export in `out/`.

## Model boundaries

- PN depletion and Schottky widths use the depletion approximation. Inputs outside that regime display an error instead of silently clipping the result.
- Degenerate carrier positions use a numerical Fermi–Dirac integral. The simplified P⁺N and N⁺P expressions assume a midgap intrinsic level and a Fermi level at the heavy-side band edge.
- Schottky C–V excludes diffusion capacitance, image-force lowering, interface-state dispersion, and strong-forward-bias effects.
- The NiSi/n-Si 0.67 eV teaching reference is based on a [measured barrier-height result](https://doi.org/10.1016/S0038-1101(03)00286-7). The adjustable p-Si reference is 0.45 eV, as reported in a [p-type measurement](https://avesis.uludag.edu.tr/yayin/c1235786-676b-42d1-acf7-6ceafb248039/temperature-dependent-electrical-behavior-of-nickel-silicide-schottky-diodes-on-p-type-silicon). These need not add to one exact silicon bandgap because they come from distinct physical interfaces and measurement conditions.
