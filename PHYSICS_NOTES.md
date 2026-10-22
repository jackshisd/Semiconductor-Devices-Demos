# Physics and slide source index

All eight supplied lecture PDFs (260 pages) were text-scanned, with rendered checks of diagrams and tables. Page numbers below are one-based PDF pages. `lib/slide-demo-assignments.ts` is the authoritative navigation map; `components/CourseNotes.tsx` provides the visible explanation and source links for every demo.

Repeated slides now defer automatic demo opening to the later lecture. The table below indexes source material, including earlier copies; it is not the navigation map.

## Added visual models

- **Matthiessen's rule (L4 p6–8):** inverse mobilities add for independent scattering mechanisms with the same effective mass. The model uses μph = 1400(T/300)⁻³ᐟ² and μimp = 1400(T/300)³ᐟ²(10¹⁶/Nionized) in cm²/(V·s). Only the proportionalities are from the slides; reference constants are illustrative, not a fit. Three lanes compare isolated mechanisms with the selected combination. Physical readouts use uncapped mobilities; the animation is deliberately slowed and its event rates capped. The both-off state has no finite scattering-limited mobility and is shown without infinite chart values.
- **Carrier distributions (L3 p8):** DOS and carrier spectra now use labeled absolute axes in cm⁻³/eV, shared by electrons and holes. No independent peak scaling is used. A log-axis toggle exposes minority carriers; occupation remains a probability from zero to one.

- **Thermal motion versus drift (L3 p23–25):** RMS thermal speeds use √(3kBT/m*) and the slide conductivity masses. Two animated ensembles compare thermal-only motion with field-driven drift. Visual drift is exaggerated, while physical readouts retain cm/s units. The 300 K mobilities are held fixed to isolate the comparison.
- **Velocity saturation (L3 p28):** animated electron/hole lanes share a speed scale. A capped μE illustration shows the slide's 8 × 10⁶ / 6 × 10⁶ cm/s limits, with uncapped low-field extrapolations. It is explicitly schematic rather than a fitted high-field law.
- **Momentum and mean free path (L3 p29–32):** reproducible exponential waiting times illustrate field-gained momentum reset by scattering. μ = qτ/m* and ℓ = vthτ use SI conversion before displaying cm/s and nm. A flight-length ruler measures thermal path length, not net drift displacement.

- **Electron versus hole transport (L2 p12; L3 p26):** eight schematic sites show a conduction electron moving against the field and neighboring bond electrons filling a vacancy. Each completed hop lands on a site; contacts restart a carrier. This is a slowed illustration, not a hopping-rate or band-transport calculation.
- **Phonon scattering (L4 p4, repeated from L3 p33):** lattice vibrations increase with temperature. The qualitative trajectory sampler increases the direction-randomization rate as T³ᐟ² and thermal speed as √T, illustrating decreasing phonon-limited mobility.
- **Ionized impurity scattering (L4 p5–8, repeated from L3 p34–37):** screened, softened Coulomb deflections show attraction to donors and repulsion from acceptors. Faster electrons deflect less. Displayed ion counts grow schematically with logarithmic doping; they are not spatially calibrated. The slide relationship μimpurity ∝ T³ᐟ²/(ND + NA) is shown separately from the illustrative dynamics.
- **Midterm prep:** the two-page LaTeX guide keeps lecture formula assumptions, signs and units adjacent to each topic. Its source is `guides/midterm/main.tex`.

| Topic                          | Slides                  | Scope                                                                                                |
| ------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Intrinsic silicon              | L1 25–27; L3 10–12      | n = p = ni; ni = √(Nc Nv) exp(−Eg/2kT); Nc,Nv scale with T³ᐟ²                                        |
| Band formation / DOS           | L2 9–11,15–16           | 4N states in each band; near-edge 3D DOS grows as √energy; level positions are schematic             |
| Donors / acceptors             | L2 17–25,27; L3 13–16   | Complete-ionization neutrality, np = ni²; As 54 meV and B 45 meV                                     |
| Thermal equilibrium            | L2 28–29                | Balanced reverse processes and the vibrating sand dish; qualitative vibration, no Kelvin calibration |
| Boltzmann approximation        | L2 30–32; L3 5          | Exact occupation, electron and hole tails, 3kT criterion                                             |
| Carrier spectra                | L3 4,6–9                | DOS × occupation; integrals give n and p; numerical integration is an implementation detail          |
| Degeneracy                     | L3 17–18,20             | EF relative to band edges; nondegenerate window; 300 K thresholds 1.6e18 / 9.1e17 cm⁻³               |
| Drift / diffusion              | L3 26–31,38–39; L4 9–24 | Carrier drift, concentration gradients, current signs and D/μ = kT/q                                 |
| Continuity                     | L5 11–16,20             | Accumulation, current divergence and pair generation/recombination; equivalent equation forms        |
| Minority diffusion             | L5 6,17–19; L7 14–15    | Field-free, steady, low-injection exponential profile and L = √(Dτ)                                  |
| Quasi-Fermi levels             | L5 8–10,21–23           | Equal-pair injection; Fn = Ei + kT ln(n/ni), Fp = Ei − kT ln(p/ni)                                   |
| Schottky contacts              | L5 26–40; L6 4–8        | Ideal and tabulated barriers, bias, depletion field and width                                        |
| Capacitance                    | L6 9–11                 | C = εA/W; slope/intercept of 1/C²                                                                    |
| Doping profiles / PN depletion | L6 12–30                | Net doping, charge neutrality, Poisson integration, voltage-dependent widths                         |
| Built-in potential             | L6 17                   | Nondegenerate VT ln(NA ND/ni²)                                                                       |
| Heavily doped junctions        | L6 18,27                | Heavy-side EF pinned at a band edge; Eg/2 + kT ln(Nlight/ni)                                         |
| Ideal diode                    | L7 4–21                 | Ideal current and saturation density from minority injection; low-injection assumptions              |
| Avalanche                      | L8 4–7,9–10,17          | Impact-created EHPs, critical-field breakdown estimate; qualitative carrier cascade                  |
| Zener                          | L8 8                    | Aligned valence/conduction states across a narrow heavy-doped junction; qualitative tunneling        |

## Course constants and limits

- Silicon Eg = 1.12 eV, fixed as in the course calculations. No Varshni relation is shown or used.
- Nc(300 K) = 2.82e19 and Nv(300 K) = 1.83e19 cm⁻³.
- Lecture 5 slide 33 gives NiSi ΦM = 4.65 eV, ΦBn = 0.65 eV and ΦBp = 0.47 eV. W/Pt alternatives use the metal table on slide 32.
- The standalone NiSi four-case exercise retains its specified εs = 12(8.85e−14) F/cm; general bulk-silicon calculations use 11.7ε0.
- The band-splitting animation shows the course state count and a square-root DOS illustration, rather than claiming an exact finite silicon cluster spectrum.
- The original avalanche and Zener demos were restored at the user’s request. They expose their earlier illustrative ionization-coefficient fit and triangular-barrier WKB model; their assumptions are stated in the demos. These extensions go beyond the lecture equations.
- The ideal diode's breakdown panel reproduces the qualitative Lecture 8 slide 4 shape on schematic axes, separately from its quantitative ideal-current plots.
- The restored Zener demo uses a chosen barrier width and voltage drop, rather than a self-consistent junction or calibrated current solution.
- The P⁺N/N⁺P junction approximation requires the light side to remain nondegenerate. The website does not offer an additional Fermi-integral junction mode.
