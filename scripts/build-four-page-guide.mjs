// Build the expanded PDF from HTML so the formulas stay crisp in the printed sheet.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import katex from 'katex';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const root = resolve('.');
const temp = resolve(root, 'tmp/pdfs');
const output = resolve(root, 'output/pdf');
const publicGuides = resolve(root, 'public/guides');
mkdirSync(temp, { recursive: true });
mkdirSync(output, { recursive: true });
mkdirSync(publicGuides, { recursive: true });

const math = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'ignore' });
const formula = (tex, purpose, compact = false) =>
  `<div class="formula${compact ? ' compact' : ''}"><div class="math">${math(tex)}</div><div class="purpose">${purpose}</div></div>`;
const topic = (title, reference) =>
  `<div class="topic"><strong>${title}</strong><span>${reference}</span></div>`;
const note = (body) => `<div class="note">${body}</div>`;
const mobilityAt = (density, carrier) =>
  carrier === 'electron'
    ? 92 + 1308 / (1 + (density / 9e16) ** 0.7)
    : 54 + 446 / (1 + (density / 1.5e17) ** 0.8);
const compactGraph = (kind) => {
  const mobility = kind === 'mobility';
  const x = (density) => 32 + ((Math.log10(density) - 13) / 7) * 138;
  const y = (value) =>
    mobility ? 96 - (value / 1500) * 72 : 96 - ((Math.log10(value) + 4) / 7) * 72;
  const line = (carrier) =>
    Array.from({ length: 85 }, (_, index) => {
      const density = 10 ** (13 + index / 12);
      const mu = mobilityAt(density, carrier);
      const value = mobility ? mu : 1 / (1.602e-19 * density * mu);
      return `${index ? 'L' : 'M'}${x(density).toFixed(1)},${y(value).toFixed(1)}`;
    }).join(' ');
  const yTicks = mobility
    ? [
        [0, '0'],
        [500, '500'],
        [1000, '1000'],
        [1500, '1500'],
      ]
    : [
        [1e-4, '10⁻⁴'],
        [1e-2, '10⁻²'],
        [1, '1'],
        [1e2, '10²'],
      ];
  return `<div class="mini-graph"><strong>${mobility ? 'Si mobility · 300 K (L3 p36)' : 'Si resistivity · 300 K (L3 p40)'}</strong>
<svg viewBox="0 0 180 123" role="img" aria-label="${mobility ? 'Electron and hole mobility versus total dopant concentration' : 'N-type and p-type resistivity versus doping'}">
<text x="33" y="12" class="axis-title">${mobility ? 'μ (cm²/V·s)' : 'ρ (Ω·cm)'}</text>
${yTicks.map(([value, label]) => `<line x1="32" y1="${y(value)}" x2="170" y2="${y(value)}" class="grid"/><text x="28" y="${y(value) + 2}" text-anchor="end" class="tick">${label}</text>`).join('')}
${[14, 17, 20].map((exponent) => `<line x1="${x(10 ** exponent)}" y1="24" x2="${x(10 ** exponent)}" y2="96" class="grid"/><text x="${x(10 ** exponent)}" y="107" text-anchor="middle" class="tick">10${String(exponent).replace(/\d/g, (digit) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(digit)])}</text>`).join('')}
<path d="M32,24 V96 H170" class="axis"/><path d="${line('electron')}" class="electron-line"/><path d="${line('hole')}" class="hole-line"/>
<text x="169" y="10" text-anchor="end" class="legend"><tspan fill="#2672d9">${mobility ? 'e⁻' : 'n-type'}</tspan><tspan fill="#d56138">  ${mobility ? 'h⁺' : 'p-type'}</tspan></text>
<text x="101" y="120" text-anchor="middle" class="axis-title">${mobility ? 'Nᴅ + Nᴀ' : 'Nᴀ or Nᴅ'} (cm⁻³)</text></svg></div>`;
};
const temperatureMobilityGraph = () => {
  const densities = [1e14, 1e16, 1e17, 1e18, 1e19];
  const colors = ['#2672d9', '#14875f', '#8057a3', '#d18430', '#bf5454'];
  const x = (temperature) => 34 + ((Math.log10(temperature) - 2) / 1) * 295;
  const y = (mobility) =>
    119 - ((Math.log10(mobility) - Math.log10(20)) / (4 - Math.log10(20))) * 84;
  const mobility = (temperature, density) => {
    const phonon = 1400 * (temperature / 300) ** -1.5;
    const impurity = 8000 * (temperature / 300) ** 1.5 * (1e16 / density) ** 0.6;
    return 1 / (1 / phonon + 1 / impurity);
  };
  const curves = densities
    .map((density, index) => {
      const path = Array.from({ length: 95 }, (_, point) => {
        const temperature = 100 * 10 ** (point / 94);
        return `${point ? 'L' : 'M'}${x(temperature).toFixed(1)},${y(mobility(temperature, density)).toFixed(1)}`;
      }).join(' ');
      return `<path d="${path}" fill="none" stroke="${colors[index]}" stroke-width="1.6"/>`;
    })
    .join('');
  return `<div class="temperature-graph"><strong>Si mobility vs temperature (L4 p8) · illustrative</strong>
<svg viewBox="0 0 350 145" role="img" aria-label="Illustrative silicon mobility versus temperature on logarithmic axes for donor concentrations from ten to the fourteenth to ten to the nineteenth per cubic centimeter">
<defs><clipPath id="temperature-mobility-clip"><rect x="34" y="35" width="295" height="84"/></clipPath></defs>
${[100, 300, 1000].map((temperature) => `<line x1="${x(temperature)}" y1="35" x2="${x(temperature)}" y2="119" class="grid"/><text x="${x(temperature)}" y="130" text-anchor="middle" class="tick">${temperature}</text>`).join('')}
${[100, 1000, 10000].map((value) => `<line x1="34" y1="${y(value)}" x2="329" y2="${y(value)}" class="grid"/><text x="30" y="${y(value) + 2}" text-anchor="end" class="tick">10${String(Math.log10(value)).replace(/\d/g, (digit) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(digit)])}</text>`).join('')}
<path d="M34 35 V119 H329" class="axis"/><g clip-path="url(#temperature-mobility-clip)">${curves}</g>
<text x="34" y="16" class="axis-title">μ (cm²/V·s)</text>
${densities.map((density, index) => `<line x1="${126 + index * 43}" y1="13" x2="${137 + index * 43}" y2="13" stroke="${colors[index]}" stroke-width="2"/><text x="${139 + index * 43}" y="15" class="tick">10${String(Math.log10(density)).replace(/\d/g, (digit) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(digit)])}</text>`).join('')}
<text x="182" y="142" text-anchor="middle" class="axis-title">Temperature (K); legend Nᴅ in cm⁻³</text></svg></div>`;
};
const continuityCases = () =>
  `<div class="case-list"><div><b>Zero field / no drift:</b> ${math(String.raw`\mathcal E=0\Rightarrow J_n=qD_n n',\;J_p=-qD_p p'`)}. Diffusion can still flow.</div>
<div><b>Thermal equilibrium:</b> ${math(String.raw`\partial_t n=\partial_t p=0,\;G=R,\;J_n=J_p=0`)}. Drift and diffusion may cancel.</div>
<div><b>Uniform, steady light:</b> ${math(String.raw`0=G_L-\Delta n/\tau_n\Rightarrow\Delta n=G_L\tau_n`)} for minority electrons in p-type Si.</div></div>`;
const schottkyBandDiagram = (type) => {
  const n = type === 'n';
  const ef = 70;
  const vacuumSurface = n ? 18 : 28;
  const vacuumBulk = n ? 31 : 16;
  const ecSurface = n ? 43 : 53;
  const ecBulk = n ? 56 : 41;
  const evSurface = n ? 91 : 103;
  const evBulk = n ? 104 : 91;
  const barrierEdge = n ? ecSurface : evSurface;
  const bendSurface = n ? ecSurface : evSurface;
  const bendBulk = n ? ecBulk : evBulk;
  const bracket = (x, a, b) =>
    `<path d="M${x - 3} ${a} H${x + 3} M${x} ${a} V${b} M${x - 3} ${b} H${x + 3}" class="band-bracket"/>`;
  return `<svg viewBox="0 0 240 132" role="img" aria-label="Equilibrium Schottky barrier band diagram for metal and ${n ? 'n-type' : 'p-type'} silicon, labeling vacuum level, metal work function, electron affinity, barrier height, built-in band bending and depletion width">
<rect x="0" y="0" width="55" height="132" fill="#edf5f4"/><rect x="55" y="0" width="104" height="132" fill="#f6fafb"/>
<line x1="55" y1="11" x2="55" y2="113" class="band-interface"/><line x1="159" y1="11" x2="159" y2="113" class="band-interface"/>
<text x="3" y="9" class="band-title">Metal</text><text x="61" y="9" class="band-title">${n ? 'n-Si · ΦM &gt; ΦS' : 'p-Si · ΦM &lt; ΦS'}</text>
<path d="M3 ${vacuumSurface} H55 C85 ${vacuumSurface} 101 ${vacuumBulk} 206 ${vacuumBulk}" class="band-vacuum"/>
<line x1="3" y1="${ef}" x2="206" y2="${ef}" class="band-fermi"/>
<path d="M55 ${ecSurface} C85 ${ecSurface} 101 ${ecBulk} 206 ${ecBulk}" class="band-ec"/>
<path d="M55 ${evSurface} C85 ${evSurface} 101 ${evBulk} 206 ${evBulk}" class="band-ev"/>
${bracket(13, vacuumSurface, ef)}<text x="17" y="${(vacuumSurface + ef) / 2 + 2}" class="band-label">ΦM</text>
${bracket(46, barrierEdge, ef)}<text x="28" y="${(barrierEdge + ef) / 2 + 2}" class="band-label">ΦB${type}</text>
${bracket(70, vacuumSurface, ecSurface)}<text x="75" y="${(vacuumSurface + ecSurface) / 2 + 2}" class="band-label">χ</text>
${bracket(144, bendSurface, bendBulk)}<text x="150" y="${(bendSurface + bendBulk) / 2 + 2}" class="band-label">qVbi,${type}</text>
<path d="M55 115 V120 H159 V115" class="band-bracket"/><text x="107" y="129" text-anchor="middle" class="band-label">W · depletion</text>
<text x="212" y="${vacuumBulk + 2}" class="band-label">E₀</text><text x="212" y="${ecBulk + 2}" class="band-label">Eᴄ</text><text x="212" y="${ef + 2}" class="band-label">Eꜰ</text><text x="212" y="${evBulk + 2}" class="band-label">Eᴠ</text>
</svg>`;
};

const pages = [
  {
    subtitle: 'Carriers, statistics and doping',
    left: [
      topic('Reference values at 300 K', 'L1 p25; L3 p8–10'),
      formula(
        String.raw`q=1.602\times10^{-19}\,\mathrm C,\quad k_B=8.617\times10^{-5}\,\mathrm{eV/K}`,
        'For V_T, use k_B = 1.381 × 10⁻²³ J/K with q in C.',
      ),
      formula(
        String.raw`V_T=\frac{k_BT}{q}=25.85\,\mathrm{mV}`,
        'Thermal voltage in transport and junction formulas.',
      ),
      formula(
        String.raw`E_{g,\mathrm{Si}}\approx1.12\,\mathrm{eV},\quad\varepsilon_{\mathrm{Si}}=11.7\varepsilon_0`,
        'Silicon gap and permittivity; ε₀ = 8.85 × 10⁻¹⁴ F/cm.',
      ),
      formula(
        String.raw`N_C=2.82\times10^{19},\quad N_V=1.83\times10^{19}\,\mathrm{cm^{-3}}`,
        'Effective band-state densities at 300 K.',
      ),
      formula(
        String.raw`n_i\approx10^{10}\,\mathrm{cm^{-3}}`,
        'Rounded course value for silicon at 300 K.',
      ),
      topic('1. Occupation and carrier statistics', 'L2 p15, 30–32; HW1 P1–2'),
      formula(
        String.raw`f(E)=\frac{1}{1+\exp[(E-E_F)/(k_BT)]}`,
        'Probability that an electron state is occupied.',
      ),
      formula(String.raw`f(E_F)=\frac12`, 'At the Fermi level, regardless of temperature.'),
      formula(String.raw`f(E_F+k_BT)=\frac1{1+e}\approx0.269`, 'One-kT occupation check; HW1 P2.'),
      formula(String.raw`f(E)\approx e^{-(E-E_F)/(k_BT)}`, 'Boltzmann tail when E − E_F ≥ 3k_BT.'),
      formula(String.raw`1-f(E)\approx e^{-(E_F-E)/(k_BT)}`, 'Empty-state probability below E_F.'),
      topic('Density of states and thermal carriers', 'L2 p8–10, 26; L3 p6–12'),
      formula(
        String.raw`g_C(E)\propto\sqrt{E-E_C},\quad g_V(E)\propto\sqrt{E_V-E}`,
        'Allowed-state density near each band edge.',
      ),
      formula(
        String.raw`n=\int_{E_C}^{\infty}g_Cf\,dE,\quad p=\int_{-\infty}^{E_V}g_V(1-f)\,dE`,
        'Count occupied conduction and empty valence states.',
        true,
      ),
      formula(
        String.raw`N_C=2\left(\frac{2\pi m^*_{n,\mathrm{DOS}}k_BT}{h^2}\right)^{3/2}`,
        'Conduction-band effective density of states; use DOS mass.',
        true,
      ),
      formula(
        String.raw`N_V=2\left(\frac{2\pi m^*_{p,\mathrm{DOS}}k_BT}{h^2}\right)^{3/2}`,
        'Valence-band effective density of states; use DOS mass.',
        true,
      ),
      note('Use kg, J and s in the DOS equations; divide m⁻³ by 10⁶ to obtain cm⁻³.'),
      formula(
        String.raw`N_{C,V}(T)=N_{C,V}(300\,\mathrm K)\left(\frac{T}{300\,\mathrm K}\right)^{3/2}`,
        'Scale effective state densities with T; fixed DOS mass.',
        true,
      ),
      formula(
        String.raw`n=N_Ce^{-(E_C-E_F)/(k_BT)},\quad p=N_Ve^{-(E_F-E_V)/(k_BT)}`,
        'Carrier densities in the nondegenerate limit.',
        true,
      ),
      formula(
        String.raw`n_i=\sqrt{N_CN_V}\,e^{-E_g/(2k_BT)}`,
        'Intrinsic concentration; HW1 temperature and gap changes.',
      ),
      topic('Units and polarity reminders', 'HW1 P4–5; HW2 P4'),
      formula(
        String.raw`\begin{aligned}1\,\mu\mathrm m&=10^{-4}\,\mathrm{cm},\quad1\,\mathrm{nm}=10^{-7}\,\mathrm{cm}\\1\,\mathrm{eV}/q&\equiv1\,\mathrm V\end{aligned}`,
        'Convert lengths before R, W or diffusion; barriers to volts.',
        true,
      ),
    ].join(''),
    right: [
      topic('HW1: compare intrinsic concentrations', 'HW1 P1; L2 p26'),
      formula(
        String.raw`\frac{n_i(T_2)}{n_i(T_1)}=\left(\frac{T_2}{T_1}\right)^{3/2}\exp\!\left[-\frac{E_g}{2k_B}\left(\frac1{T_2}-\frac1{T_1}\right)\right]`,
        'Use for two temperatures when E_g is held fixed.',
        true,
      ),
      formula(
        String.raw`\frac{n_{i,2}}{n_{i,1}}=\exp\!\left(\frac{E_{g,1}-E_{g,2}}{2k_BT}\right)`,
        'Use for a bandgap change at fixed T.',
      ),
      topic('2. Doping and charge neutrality', 'L2 p23–26; L3 p13–20; HW1 P3, P5'),
      note(
        '<b>Si donors (group V):</b> P, As, Sb have five valence electrons; they supply mobile electrons (n-type, Nᴅ⁺). <b>Si acceptors (group III):</b> B, Al, Ga, In have three valence electrons; they create holes (p-type, Nᴀ⁻). L2 p17–19.',
      ),
      formula(String.raw`np=n_i^2`, 'Mass action at thermal equilibrium only.'),
      formula(String.raw`n+N_A^-=p+N_D^+`, 'Charge neutrality; use ionized dopants.'),
      formula(String.raw`\Delta N=N_D-N_A`, 'Net donor concentration for compensated material.'),
      formula(
        String.raw`n\approx N_D-N_A,\quad p\approx n_i^2/n`,
        'Majority and minority carriers for n-type; full ionization.',
      ),
      formula(
        String.raw`p\approx N_A-N_D,\quad n\approx n_i^2/p`,
        'Majority and minority carriers for p-type; full ionization.',
      ),
      formula(
        String.raw`n=\frac{\Delta N+\sqrt{\Delta N^2+4n_i^2}}{2}`,
        'Exact neutrality result near intrinsic or compensated conditions.',
      ),
      formula(String.raw`p=\frac{n_i^2}{n}`, 'Recover the exact hole density at equilibrium.'),
      note('HW1 P5: net doping sets n or p; total ionized impurities N_D + N_A affect mobility.'),
      topic('Fermi-level location', 'L3 p11–20; HW2 P3'),
      formula(
        String.raw`E_F-E_i=k_BT\ln(n/n_i)`,
        'Find equilibrium Fermi shift from electron density.',
      ),
      formula(
        String.raw`E_i-E_F=k_BT\ln(p/n_i)`,
        'Find equilibrium Fermi shift from hole density.',
      ),
      formula(
        String.raw`E_C-E_F=k_BT\ln(N_C/n)`,
        'Conduction-edge separation in Boltzmann regime.',
      ),
      formula(String.raw`E_F-E_V=k_BT\ln(N_V/p)`, 'Valence-edge separation in Boltzmann regime.'),
      formula(
        String.raw`E_i=\frac{E_C+E_V}{2}+\frac{k_BT}{2}\ln\!\frac{N_V}{N_C}`,
        'Intrinsic level when conduction and valence DOS differ.',
      ),
      formula(
        String.raw`E_V+3k_BT\lesssim E_F\lesssim E_C-3k_BT`,
        'Check nondegenerate approximation before using exponentials.',
      ),
      note(
        'Assumptions: thermal equilibrium, parabolic bands and full ionization unless noted. At high doping use Fermi-Dirac statistics.',
      ),
    ].join(''),
  },
  {
    subtitle: 'Motion, conductivity and continuity',
    left: [
      topic('3. Drift, mobility and resistivity', 'L3 p26–41; L4 p4–22; HW1 P4–5'),
      formula(
        String.raw`v_n=-\mu_n\mathcal E,\quad v_p=+\mu_p\mathcal E`,
        'Electron velocity opposes the field; hole velocity follows.',
      ),
      formula(String.raw`\mu=\frac{q\tau}{m^*}`, 'Relate mobility to mean scattering time.'),
      formula(
        String.raw`\ell=v_{\rm th}\tau=v_{\rm th}\frac{\mu m^*}{q}`,
        'Mean free path from thermal speed; HW1 P4.',
      ),
      formula(
        String.raw`\frac1\mu=\frac1{\mu_{\rm ph}}+\frac1{\mu_{\rm imp}}`,
        'Matthiessen rule; lower mobility dominates.',
      ),
      formula(
        String.raw`\mu_{\rm ph}\propto T^{-3/2},\quad\mu_{\rm imp}\propto\frac{T^{3/2}}{N_D+N_A}`,
        'Estimate which scattering process changes with T.',
      ),
      formula(
        String.raw`\sigma=q(n\mu_n+p\mu_p),\quad\rho_{\rm res}=1/\sigma`,
        'Conductivity and resistivity from carrier densities.',
      ),
      formula(
        String.raw`R=\rho_{\rm res}L/A`,
        'Convert material resistivity to device resistance.',
      ),
      note(
        'HW1 P5: convert dimensions to cm before using Ω·cm. Mobility follows total dopant concentration; resistivity curves assume one dopant type.',
      ),
      topic('Drift and diffusion current', 'L3 p28–32; L4 p18–27'),
      formula(
        String.raw`J_{n,\rm drift}=qn\mu_n\mathcal E,\quad J_{p,\rm drift}=qp\mu_p\mathcal E`,
        'Conventional current from field-driven carriers.',
      ),
      formula(
        String.raw`J_{n,\rm diff}=qD_n\frac{dn}{dx}`,
        'Electron diffusion current from density gradient.',
      ),
      formula(
        String.raw`J_{p,\rm diff}=-qD_p\frac{dp}{dx}`,
        'Hole diffusion current from density gradient.',
      ),
      formula(
        String.raw`J_n=qn\mu_n\mathcal E+qD_n\frac{dn}{dx}`,
        'Total electron current: drift plus diffusion.',
      ),
      formula(
        String.raw`J_p=qp\mu_p\mathcal E-qD_p\frac{dp}{dx}`,
        'Total hole current: drift plus diffusion.',
      ),
      formula(
        String.raw`\frac{D_n}{\mu_n}=\frac{D_p}{\mu_p}=V_T`,
        'Einstein relation for nondegenerate carriers.',
      ),
      formula(
        String.raw`\mathcal E=-\frac{d\psi}{dx}=\frac1q\frac{dE_C}{dx}`,
        'Electric field from potential or band-edge slope.',
      ),
      formula(
        String.raw`\mathcal E=-\frac{V_T}{n}\frac{dn}{dx}`,
        'Equilibrium field that cancels electron diffusion.',
      ),
      note('For the band-edge slope, E_C must be in joules when q is in coulombs.'),
      `<div class="mini-graphs">${compactGraph('mobility')}${compactGraph('resistivity')}</div>`,
    ].join(''),
    right: [
      topic('4. Continuity and generation', 'L4 p29–32; HW2 P1–2'),
      formula(
        String.raw`\frac{\partial n}{\partial t}=\frac1q\frac{\partial J_n}{\partial x}+G-R`,
        'Electron balance in one dimension.',
      ),
      formula(
        String.raw`\frac{\partial p}{\partial t}=-\frac1q\frac{\partial J_p}{\partial x}+G-R`,
        'Hole balance in one dimension.',
      ),
      formula(
        String.raw`\frac{\partial n}{\partial t}=\mu_n\frac{\partial(n\mathcal E)}{\partial x}+D_n\frac{\partial^2 n}{\partial x^2}+G-R`,
        'Expanded electron form: drift, diffusion, generation and loss.',
        true,
      ),
      formula(
        String.raw`\frac{\partial p}{\partial t}=-\mu_p\frac{\partial(p\mathcal E)}{\partial x}+D_p\frac{\partial^2 p}{\partial x^2}+G-R`,
        'Expanded hole form for constant mobility and diffusivity.',
        true,
      ),
      formula(
        String.raw`\Delta n=\Delta p`,
        'Pair generation changes both carrier populations equally.',
      ),
      formula(
        String.raw`\Delta n=G_L\tau_n`,
        'Uniform steady low-injection photogeneration; HW2 P1.',
      ),
      formula(
        String.raw`n=n_0+\Delta n,\quad p=p_0+\Delta p`,
        'Total density during illumination.',
      ),
      formula(
        String.raw`\frac{\partial\Delta p}{\partial t}=D_p\frac{\partial^2\Delta p}{\partial x^2}-\frac{\Delta p}{\tau_p}+G_L`,
        'Field-free low-injection excess-hole generation equation.',
        true,
      ),
      formula(
        String.raw`\frac{\partial\Delta n}{\partial t}=D_n\frac{\partial^2\Delta n}{\partial x^2}-\frac{\Delta n}{\tau_n}+G_L`,
        'Electron counterpart for a p-type neutral region.',
        true,
      ),
      note(
        'Expanded forms assume constant μ and D. Low injection: excess carriers ≪ equilibrium majority density; in p-type Si compare Δn with p₀.',
      ),
      topic('Minority diffusion and illuminated bar', 'L4 p29–32; L5 p5–17; HW2 P2'),
      formula(
        String.raw`D_p\frac{d^2\Delta p}{dx^2}-\frac{\Delta p}{\tau_p}=0`,
        'Steady, field-free, unilluminated interior.',
      ),
      formula(
        String.raw`L_p=\sqrt{D_p\tau_p},\quad L_n=\sqrt{D_n\tau_n}`,
        'Distance excess minority carriers survive.',
      ),
      formula(
        String.raw`\Delta p(x)=Ae^{-x/L_p}+Be^{x/L_p}`,
        'General one-dimensional diffusion solution.',
      ),
      formula(
        String.raw`\Delta p(0)=\Delta p(L)=\gamma N_D`,
        'Boundary condition for equal end illumination.',
      ),
      formula(
        String.raw`\Delta p(x)=\gamma N_D\frac{\cosh[(x-L/2)/L_p]}{\cosh[L/(2L_p)]}`,
        'Symmetric bar profile satisfying both ends.',
        true,
      ),
      formula(
        String.raw`J_p(x)=-qD_p\frac{d\Delta p}{dx}`,
        'Hole current at an edge; differentiate the profile.',
      ),
      formula(
        String.raw`\Delta p(x)=\Delta p(0)e^{-x/L_p}`,
        'Single-edge decay into a long neutral region.',
      ),
      formula(
        String.raw`\Delta p(t)=\Delta p(0)e^{-t/\tau_p}`,
        'Time decay after generation stops; no spatial current.',
      ),
      formula(
        String.raw`J_p(0)=\frac{qD_p\gamma N_D}{L_p}\tanh\!\frac{L}{2L_p}`,
        'Hole diffusion current entering the equally lit bar.',
      ),
      note(
        'In HW2 P2, γ is stated as 10⁻⁴. Use the stated boundary value when checking the worked solution.',
      ),
    ].join(''),
  },
  {
    subtitle: 'Quasi-Fermi levels and PN electrostatics',
    left: [
      topic('5. Quasi-Fermi levels', 'L5 p21–23; HW2 P3'),
      formula(String.raw`n=n_i e^{(F_n-E_i)/(k_BT)}`, 'Electron density out of equilibrium.'),
      formula(String.raw`p=n_i e^{(E_i-F_p)/(k_BT)}`, 'Hole density out of equilibrium.'),
      formula(String.raw`F_n=E_i+k_BT\ln(n/n_i)`, 'Locate electron quasi-Fermi level.'),
      formula(String.raw`F_p=E_i-k_BT\ln(p/n_i)`, 'Locate hole quasi-Fermi level.'),
      formula(
        String.raw`np=n_i^2 e^{(F_n-F_p)/(k_BT)}`,
        'Connect quasi-Fermi splitting to pair density.',
      ),
      note(
        'At equilibrium F_n = F_p = E_F. HW2 P3: low injection barely moves the majority quasi-Fermi level; high injection moves both.',
      ),
      topic('Electrostatic potential and Poisson equation', 'L5 p24–25; L6 p17–20'),
      formula(
        String.raw`\rho_{\rm ch}=q(p-n+N_D^+-N_A^-)`,
        'Local space charge, including ionized dopants.',
      ),
      formula(
        String.raw`\frac{d\mathcal E}{dx}=\frac{\rho_{\rm ch}}{\varepsilon_s}`,
        'Field slope from charge density.',
      ),
      formula(
        String.raw`\mathcal E=-\frac{d\psi}{dx},\quad\frac{d^2\psi}{dx^2}=-\frac{\rho_{\rm ch}}{\varepsilon_s}`,
        'Potential slope and curvature.',
      ),
      formula(
        String.raw`\psi(x_2)-\psi(x_1)=V_T\ln\!\frac{n(x_2)}{n(x_1)}`,
        'Equilibrium potential difference from electron densities.',
      ),
      topic('6. Abrupt PN junction: voltage and width', 'L6 p17–29'),
      formula(
        String.raw`V_{bi}=V_T\ln\!\left(\frac{N_AN_D}{n_i^2}\right)`,
        'Built-in potential at equilibrium.',
      ),
      topic('One degenerately doped PN side', 'L6 p18'),
      formula(
        String.raw`qV_{bi}=(E_i-E_F)_{p}+(E_F-E_i)_{n}`,
        'Add the p-side and n-side Fermi-level offsets.',
        true,
      ),
      formula(
        String.raw`\begin{aligned}p^+n:\quad qV_{bi}&\approx\frac{E_g}{2}+k_BT\ln\!\frac{N_D}{n_i}\\n^+p:\quad qV_{bi}&\approx\frac{E_g}{2}+k_BT\ln\!\frac{N_A}{n_i}\end{aligned}`,
        'Band-edge Fermi levels, midgap E_i; light side nondegenerate.',
        true,
      ),
      formula(String.raw`U=V_{bi}-V_A>0`, 'Voltage across depletion; forward PN bias lowers U.'),
      formula(
        String.raw`W=\sqrt{\frac{2\varepsilon_sU}{q}\left(\frac1{N_A}+\frac1{N_D}\right)}`,
        `Total width; one-sided: ${math(String.raw`W\approx\sqrt{2\varepsilon_sU/(qN_{\rm light})}`)}.`,
        true,
      ),
      formula(
        String.raw`\begin{aligned}x_n&=\sqrt{\frac{2\varepsilon_sV_{bi}}{q}\frac{N_A}{N_D(N_A+N_D)}}\\x_p&=\sqrt{\frac{2\varepsilon_sV_{bi}}{q}\frac{N_D}{N_A(N_A+N_D)}}\end{aligned}`,
        'At equilibrium (V_A = 0). Under bias, replace V_bi with U = V_bi − V_A.',
        true,
      ),
    ].join(''),
    right: [
      topic('Abrupt PN junction: field and charge', 'L6 p21–29'),
      formula(String.raw`N_Ax_p=N_Dx_n,\quad W=x_p+x_n`, 'Charge neutrality and width split.'),
      formula(
        String.raw`x_p=\frac{WN_D}{N_A+N_D},\quad x_n=\frac{WN_A}{N_A+N_D}`,
        'Find depletion distance on each side.',
      ),
      formula(
        String.raw`|\mathcal E_{\max}|=\frac{qN_Ax_p}{\varepsilon_s}=\frac{qN_Dx_n}{\varepsilon_s}=\frac{2U}{W}`,
        'Peak triangular field; voltage is field area.',
        true,
      ),
      formula(String.raw`|Q|=qAN_Ax_p=qAN_Dx_n`, 'Magnitude of charge on either side.'),
      formula(
        String.raw`\mathcal E_p(x)=-\frac{qN_A}{\varepsilon_s}(x+x_p)`,
        'Field on the depleted p side: −x_p ≤ x ≤ 0.',
      ),
      formula(
        String.raw`\mathcal E_n(x)=\frac{qN_D}{\varepsilon_s}(x-x_n)`,
        'Field on the depleted n side: 0 ≤ x ≤ x_n.',
      ),
      formula(
        String.raw`U=-\int_{-x_p}^{x_n}\mathcal E(x)\,dx=\frac{|\mathcal E_{\max}|W}{2}`,
        'Voltage equals the triangular field area.',
      ),
      topic('7. Depletion capacitance and C–V', 'L6 p9–11'),
      formula(String.raw`C=\frac{\varepsilon_s A}{W}`, 'Small-signal depletion capacitance.'),
      formula(
        String.raw`i_{\rm ac}=C\frac{dv_{\rm ac}}{dt}`,
        'AC displacement current through depletion.',
      ),
      formula(
        String.raw`\frac1{C^2}=\frac{2(V_{bi}-V_A)}{q\varepsilon_s A^2N}`,
        'Linear C⁻² plot for a one-sided junction.',
      ),
      formula(
        String.raw`m=\frac{d(1/C^2)}{dV_A}=-\frac2{q\varepsilon_s A^2N}`,
        'Slope yields the lightly doped density.',
      ),
      formula(
        String.raw`N=-\frac2{q\varepsilon_s A^2m}`,
        'Extract doping from measured C–V slope.',
      ),
      note(
        'These C–V signs use the n-type forward-bias convention. The voltage-axis intercept is V_bi.',
      ),
      formula(
        String.raw`\begin{aligned}qV_{bi}&=\Phi_{Bn}-(E_C-E_F)_{\mathrm{FB}}\\&=\Phi_{Bn}-k_BT\ln\!\left(\frac{N_C}{N_D}\right)\end{aligned}`,
        'For an n-type Schottky contact, use V_bi from the C–V intercept and N_D from its slope to find Φ_Bn; energies in eV.',
        true,
      ),
      topic('Check before substitution', 'Lectures 5–6'),
      note(
        'Use ε in F/cm, area in cm² and dopants in cm⁻³. Inside W, fixed dopant charge dominates. Reverse bias widens W and lowers C; mark p and n sides before assigning x_p and x_n.',
      ),
      topic('Continuity: useful limiting cases', 'L4 p29–32; HW2 P1–2'),
      continuityCases(),
    ].join(''),
  },
  {
    subtitle: 'Contacts, diode current and breakdown',
    left: [
      topic('8. Metal–semiconductor contacts', 'L5 p27–39; L6 p4–8; HW2 P4'),
      formula(
        String.raw`\Phi_{Bn}=\Phi_M-\chi,\quad\Phi_{Bp}=E_g-\Phi_{Bn}`,
        'Ideal barrier energies; Φ_M is metal work function, χ electron affinity.',
        true,
      ),
      formula(
        String.raw`\Phi_{Bn}=qV_{bi,n}+(E_C-E_F)`,
        'Barrier = band bending + bulk separation; every term is an energy (eV).',
      ),
      formula(String.raw`E_C-E_F=k_BT\ln(N_C/N_D)`, 'Bulk n-type band-edge separation.'),
      formula(String.raw`E_F-E_V=k_BT\ln(N_V/N_A)`, 'Bulk p-type band-edge separation.'),
      formula(
        String.raw`V_{bi,n}=\frac{\Phi_{Bn}-(E_C-E_F)}{q}`,
        'n-type built-in voltage from barrier and bulk Fermi level.',
      ),
      formula(
        String.raw`V_{bi,p}=\frac{\Phi_{Bp}-(E_F-E_V)}{q}`,
        'p-type built-in voltage from barrier and bulk Fermi level.',
      ),
      formula(
        String.raw`W_n=\sqrt{\frac{2\varepsilon_s(V_{bi,n}-V_A)}{qN_D}}`,
        'n-type contact: reverse bias V_A < 0 widens W.',
      ),
      formula(
        String.raw`W_p=\sqrt{\frac{2\varepsilon_s(V_{bi,p}+V_A)}{qN_A}}`,
        'p-type polarity used in L6: V_A > 0 is reverse bias.',
      ),
      note(
        'HW2 P4 realistic NiSi/Si values: electron barrier Φ_Bn = 0.65 eV; hole barrier Φ_Bp = 0.47 eV. Use these instead of ideal work-function estimates.',
      ),
      note(
        'At fixed metal and semiconductor, applied bias changes band bending and W, not the interface barrier height.',
      ),
      formula(
        String.raw`\frac{W_n(V_A)}{W_n(0)}=\sqrt{1-\frac{V_A}{V_{bi,n}}}`,
        'Compare n-type contact widths across biases; HW2 P4.',
      ),
      formula(String.raw`|Q_s|=qN_DAW_n`, 'Depletion charge magnitude in an n-type contact.'),
      topic(
        'Schottky barriers at equilibrium',
        'L5 p29, 38; ideal rectifying contacts; schematic, not to scale',
      ),
      `<div class="band-diagrams">${schottkyBandDiagram('n')}${schottkyBandDiagram('p')}</div>`,
      temperatureMobilityGraph(),
    ].join(''),
    right: [
      topic('9. Ideal PN diode', 'L7 p6–20'),
      formula(
        String.raw`n_{p0}=n_i^2/N_A,\quad p_{n0}=n_i^2/N_D`,
        'Minority equilibrium densities at each neutral side.',
      ),
      formula(
        String.raw`n_p(-x_p)=n_{p0}e^{V_A/V_T},\quad p_n(x_n)=p_{n0}e^{V_A/V_T}`,
        'Minority boundary densities under applied bias.',
        true,
      ),
      formula(
        String.raw`J=J_0\big(e^{V_A/V_T}-1\big),\quad I=AJ`,
        'Ideal current density and terminal current.',
      ),
      formula(String.raw`J(V_A\ll -V_T)\approx-J_0`, 'Reverse saturation before breakdown.'),
      formula(
        String.raw`J_0=qn_i^2\left(\frac{D_n}{L_nN_A}+\frac{D_p}{L_pN_D}\right)`,
        'Reverse saturation density for long neutral regions.',
        true,
      ),
      formula(
        String.raw`\Delta p_n(x_n+x)=p_{n0}(e^{V_A/V_T}-1)e^{-x/L_p}`,
        'Injected hole profile in the neutral n-side.',
        true,
      ),
      formula(
        String.raw`\Delta V_{\rm decade}=V_T\ln 10\approx59.5\,\mathrm{mV}`,
        'Ideal 300 K semilog forward-current slope.',
      ),
      formula(
        String.raw`r_d\approx\frac{V_T}{I}`,
        'Small-signal resistance at strong ideal forward bias.',
      ),
      note(
        'Ideal law assumes low injection, steady state, long neutral regions and negligible depletion-region recombination.',
      ),
      topic('10. Nonideal current and breakdown', 'L8 p4–16'),
      formula(
        String.raw`I_{\rm R-G}\approx-\frac{qAn_iW}{2\tau_0}`,
        'Reverse generation current in depletion.',
      ),
      formula(
        String.raw`\tau_0=\frac{\tau_pn_1+\tau_np_1}{2n_i}`,
        'Effective trap lifetime used in reverse generation.',
      ),
      formula(
        String.raw`R_{\rm net}=\frac{np-n_i^2}{\tau_p(n+n_1)+\tau_n(p+p_1)}`,
        'Trap-assisted recombination; sign shows net R or G.',
        true,
      ),
      formula(
        String.raw`n_1=n_i e^{(E_T-E_i)/(k_BT)},\quad p_1=n_i e^{(E_i-E_T)/(k_BT)}`,
        'Trap reference densities from trap energy E_T.',
        true,
      ),
      formula(
        String.raw`I_{\rm F,R-G}\propto n_iW e^{V_A/(2V_T)}`,
        'Forward depletion recombination; ideality near two.',
      ),
      formula(String.raw`V_A=V_J+IR_S`, 'Subtract series drop to find junction voltage.'),
      formula(
        String.raw`V_{\rm BR}\approx\frac{\varepsilon_s\mathcal E_{\rm CR}^2}{2qN_{\rm light}}-V_{bi}`,
        'One-sided critical-field estimate; not a current law.',
        true,
      ),
      note(
        'Avalanche: impact ionization, usually wider depletion region. Zener: tunneling through very narrow, heavily doped depletion region.',
      ),
      topic('Last checks', 'Course conventions'),
      note(
        'State assumptions, use consistent cm–F–V units, keep electrons and holes distinct, and check the sign of drift versus diffusion current.',
      ),
    ].join(''),
  },
];

// The eight-page edition keeps the original course foundation on pages 1–4.
// New material starts here so the older four-page PDF remains available unchanged.
const laterPages = [
  {
    subtitle: 'Lecture 9 · minority charge and charge control',
    left: [
      topic('11. Biased PN minority carriers', 'L9 p4, 9; HW3 P2, P4'),
      formula(
        String.raw`n_{p0}=n_i^2/N_A,\quad p_{n0}=n_i^2/N_D`,
        'Equilibrium minority densities on p and n sides.',
      ),
      formula(
        String.raw`\Delta n_p(-x_p)=n_{p0}(e^{V_A/V_T}-1)`,
        'Excess electron density at the p-side edge.',
      ),
      formula(
        String.raw`\Delta p_n(x_n)=p_{n0}(e^{V_A/V_T}-1)`,
        'Excess hole density at the n-side edge.',
      ),
      formula(
        String.raw`L_n=\sqrt{D_n\tau_n},\quad L_p=\sqrt{D_p\tau_p}`,
        'Minority diffusion lengths; use D = μV_T.',
      ),
      formula(
        String.raw`\Delta n_p(x)=\Delta n_p(-x_p)e^{(x+x_p)/L_n}`,
        'Electron profile for x ≤ −x_p in a long p base.',
        true,
      ),
      formula(
        String.raw`\Delta p_n(x)=\Delta p_n(x_n)e^{-(x-x_n)/L_p}`,
        'Hole profile for x ≥ x_n in a long n base.',
        true,
      ),
      topic('HW3: minority current components', 'HW3 P2; L7 p16'),
      formula(
        String.raw`D_n=\mu_nV_T,\quad D_p=\mu_pV_T`,
        'Einstein relation before the diffusion lengths.',
      ),
      formula(String.raw`J_n(-x_p)=qD_n\Delta n_p(-x_p)/L_n`, 'Electron injection from n into p.'),
      formula(String.raw`J_p(x_n)=qD_p\Delta p_n(x_n)/L_p`, 'Hole injection from p into n.'),
      formula(
        String.raw`J_n(x)=J_n(-x_p)e^{(x+x_p)/L_n}`,
        'Electron minority current decays into the p region.',
        true,
      ),
      formula(
        String.raw`J_p(x)=J_p(x_n)e^{-(x-x_n)/L_p}`,
        'Hole minority current decays into the n region.',
        true,
      ),
      formula(
        String.raw`J_n+J_p=J_{\rm total}`,
        'Current continuity: the majority part makes up the loss.',
      ),
      formula(
        String.raw`J_0=qn_i^2\left(\frac{D_n}{N_AL_n}+\frac{D_p}{N_DL_p}\right)`,
        'Ideal long-base reverse saturation density.',
        true,
      ),
      formula(String.raw`J=J_0(e^{V_A/V_T}-1)`, 'Total ideal PN current density.'),
      formula(
        String.raw`\frac{J_p(x_n)}{J_n(-x_p)}=\frac{D_pN_AL_n}{D_nN_DL_p}`,
        'Compare hole and electron injection.',
      ),
      formula(
        String.raw`J_p(x)=\tfrac12J_{\rm total}`,
        'Equal-current plane; solve for distance from x_n.',
      ),
      formula(
        String.raw`x-x_n=L_p\ln\!\frac{2J_p(x_n)}{J_{\rm total}}`,
        'HW3 P2 equal-current distance in the n base.',
        true,
      ),
      note(
        'HW3 P2: use L_n in the electron exponent and L_p in the hole exponent. A printed intermediate line swaps the symbol.',
      ),
    ].join(''),
    right: [
      topic('12. Stored excess charge', 'L9 p4–7; HW3 P4'),
      formula(String.raw`Q_p=qA\int_{x_n}^{\infty}\Delta p_n(x)\,dx`, 'Integrate injected holes.'),
      formula(
        String.raw`Q_p=qA\Delta p_n(x_n)L_p`,
        'Positive hole charge stored in the long n base.',
      ),
      formula(
        String.raw`Q_n=-qA\int_{-\infty}^{-x_p}\Delta n_p(x)\,dx`,
        'Electron stored charge has a negative sign.',
      ),
      formula(
        String.raw`Q_n=-qA\Delta n_p(-x_p)L_n`,
        'Signed electron charge stored in the long p base.',
      ),
      formula(String.raw`\Delta p_n(x_n)=Q_p/(qAL_p)`, 'Recover edge excess from stored holes.'),
      formula(
        String.raw`I_p=Q_p/\tau_p,\quad I_n=|Q_n|/\tau_n`,
        'Steady injection replaces recombined charge.',
      ),
      formula(String.raw`I=I_p+I_n`, 'Add both conventional current components.'),
      note(
        'HW3 P4: A = 100 μm² = 10⁻⁶ cm². The electron charge Q_n is negative; use its magnitude in the current formula.',
      ),
      topic('13. Charge control: current → stored charge', 'L9 p5–7, 16–23'),
      formula(
        String.raw`I=\frac{dQ}{dt}+\frac{Q}{\tau_p}`,
        'Here I is the hole-injection component in one long base; negative I extracts charge.',
      ),
      formula(
        String.raw`I_p(x_n)-I_p(\infty)=\frac{dQ_p}{dt}+\frac{Q_p}{\tau_p}`,
        'For a long base, far-edge current vanishes; the edge hole current drives charge control.',
        true,
      ),
      formula(
        String.raw`Q(t)=I\tau_p+[Q(t_0)-I\tau_p]e^{-(t-t_0)/\tau_p}`,
        'General constant-current solution; set the initial charge at t₀.',
        true,
      ),
      formula(String.raw`Q_{\rm ss}=I_F\tau_p`, 'Stored charge under constant forward injection.'),
      formula(
        String.raw`Q(t)=I_F\tau_p(1-e^{-t/\tau_p})`,
        'Turn-on from Q(0) = 0; use I = I_F.',
      ),
      formula(
        String.raw`Q(t)=[Q(0)+I_R\tau_p]e^{-t/\tau_p}-I_R\tau_p`,
        'Reverse extraction: use I = −I_R with I_R > 0.',
        true,
      ),
      formula(
        String.raw`t_s=\tau_p\ln\!\left(1+\frac{I_F}{I_R}\right)`,
        'Storage delay if Q(0) = I_Fτ_p; set Q(t_s) = 0.',
      ),
      topic('Stored charge → diode voltage', 'L9 p16–23; quasi-static'),
      formula(String.raw`Q_0=qAp_{n0}L_p`, 'Equilibrium charge scale for injected holes; Q₀ is not initial excess charge.'),
      formula(String.raw`Q=Q_0(e^{v_a/V_T}-1)`, 'Boundary injection sets excess charge in a long n base.'),
      formula(String.raw`v_a=V_T\ln\!\left(1+\frac{Q}{Q_0}\right)`, 'Convert stored excess charge to voltage.'),
      note(
        'Use this charge-to-voltage step only while the long-base, low-injection, quasi-static model applies. It does not describe the entire turn-off waveform after storage ends.',
      ),
    ].join(''),
  },
  {
    subtitle: 'Lecture 9 · small signal, C–V and HW3 checks',
    left: [
      topic('14. Small-signal diode around DC bias', 'L9 p8–12, 15; HW3 P5'),
      formula(
        String.raw`g_d=\left.\frac{dI}{dV}\right|_{V_{DC}}\approx\frac{I_{DC}}{V_T}`,
        'Differential conductance at strong ideal forward bias.',
      ),
      formula(
        String.raw`r_d=1/g_d\approx V_T/I_{DC}`,
        'Parallel small-signal resistance, not V/I.',
      ),
      formula(String.raw`g_d=I_0e^{V_{DC}/V_T}/V_T`, 'Exact ideal conductance before I ≫ I₀.'),
      formula(
        String.raw`C_D=\frac{dQ_{\rm stored}}{dV}\approx\frac{\tau_nI_n+\tau_pI_p}{V_T}`,
        'Diffusion capacitance from stored minority charge.',
        true,
      ),
      formula(
        String.raw`C_J=\left|\frac{dQ_{\rm dep}}{dV_A}\right|=\frac{\varepsilon_sA}{W}`,
        'Depletion capacitance from changing space charge.',
      ),
      formula(String.raw`C_{\rm total}=C_J+C_D`, 'Both charge responses are parallel.'),
      formula(
        String.raw`\tau_{\rm eff}=\frac{\tau_nI_n+\tau_pI_p}{I_n+I_p}`,
        'Current-weighted minority lifetime for C_D.',
      ),
      formula(String.raw`C_D\approx\tau_{\rm eff}g_d`, 'Compact diffusion-capacitance estimate.'),
      formula(
        String.raw`i_{\rm ac}=g_dv_{\rm ac}+C_{\rm total}\frac{dv_{\rm ac}}{dt}`,
        'Parallel resistor–capacitor current relation.',
        true,
      ),
      note(
        'HW3 P5: the supplied 1 μs / 2.95 × 10⁵ Ω quotient is about 3.4 pF, not 3.9 pF; diffusion capacitance dominates the ~0.06 pF junction term.',
      ),
      topic('15. PN and Schottky depletion C–V', 'L9 p10–14; HW3 P3, P5'),
      formula(
        String.raw`W\simeq\sqrt{\frac{2\varepsilon_s(V_{bi}-V_A)}{qN_{\rm light}}}`,
        'One-sided abrupt depletion width; forward-bias convention.',
        true,
      ),
      formula(
        String.raw`W=\sqrt{\frac{2\varepsilon_s(V_{bi}-V_A)}{q}\left(\frac1{N_A}+\frac1{N_D}\right)}`,
        'Two-sided abrupt depletion approximation.',
        true,
      ),
      formula(String.raw`C_J=\varepsilon_sA/W`, 'Convert depletion width to capacitance.'),
      formula(
        String.raw`|Q_{\rm dep}|=qAN_Ax_p=qAN_Dx_n`,
        'Ionized charge magnitude on each side.',
      ),
      formula(
        String.raw`\frac1{C_J^2}=\frac{2(V_{bi}-V_A)}{q\varepsilon_sA^2N_{\rm light}}`,
        'Straight line versus applied voltage.',
        true,
      ),
      formula(
        String.raw`m=\frac{d(1/C_J^2)}{dV_A}=-\frac{2}{q\varepsilon_sA^2N_{\rm light}}`,
        'Steeper line means lighter doping.',
        true,
      ),
      formula(
        String.raw`N_{\rm light}=\frac{-2}{q\varepsilon_sA^2m}`,
        'Extract doping from measured C–V slope.',
      ),
      formula(String.raw`(1/C_J^2)_{V_A=V_{bi}}=0`, 'Extrapolated x-intercept gives V_bi.'),
      formula(String.raw`C_J\propto(V_{bi}-V_A)^{-1/2}`, 'Abrupt-junction bias trend.'),
    ].join(''),
    right: [
      topic('HW3: check built-in voltage', 'HW3 P1, P5'),
      formula(
        String.raw`V_{bi}=V_T\ln\!\frac{N_AN_D}{n_i^2}`,
        'Use both dopant densities for a nondegenerate PN junction.',
      ),
      formula(
        String.raw`V_{bi}\approx0.84\,\mathrm V`,
        'HW3 P5: use both dopants and n_i = 10¹⁰ cm⁻³.',
      ),
      formula(
        String.raw`N_Ax_p=N_Dx_n,\quad W=x_p+x_n`,
        'Depletion charge neutrality and total width.',
      ),
      formula(
        String.raw`\mathcal E(0)=-qN_Dx_n/\varepsilon_s`,
        'Peak signed field for p on left and n on right.',
      ),
      formula(
        String.raw`\psi(0)-\psi(-x_p)=qN_Ax_p^2/(2\varepsilon_s)`,
        'Potential rise from p edge to junction.',
      ),
      formula(
        String.raw`W(0.6\,\mathrm V)\approx0.18\,\mu\mathrm m`,
        'HW3 P5 after correcting V_bi.',
      ),
      formula(
        String.raw`C_J\approx0.06\,\mathrm{pF},\quad C_D\approx3.4\,\mathrm{pF}`,
        'HW3 P5 corrected capacitance scales.',
      ),
      note(
        'HW3 P1 prints an extra 1/2 in the peak-field expression and uses N_D with x_p² in its potential expression. HW3 P5 prints V_bi = 0.919 V; with N_A = 10¹⁶, N_D = 10¹⁸ and n_i = 10¹⁰ cm⁻³, the PN value is about 0.84 V.',
      ),
      topic('Schottky contact: interpret the C–V line', 'HW3 P3; L5 p27–39'),
      formula(String.raw`\Phi_{Bn}=\Phi_M-\chi`, 'Ideal n-type barrier from metal work function.'),
      formula(
        String.raw`qV_{bi}=\Phi_{Bn}-(E_C-E_F)_{\rm bulk}`,
        'Barrier minus bulk band-edge separation.',
      ),
      formula(
        String.raw`E_C-E_F=k_BT\ln(N_C/N_D)`,
        'Bulk n-type offset when Boltzmann statistics apply.',
      ),
      formula(String.raw`\Phi_{Bn}=qV_{bi}+k_BT\ln(N_C/N_D)`, 'Recover barrier from C–V.'),
      formula(String.raw`\Phi_{Bp}=E_g-\Phi_{Bn}`, 'Ideal complementary hole barrier.'),
      note(
        'For equal contact areas, the steeper 1/C² slope has lower N_D. Different doping shifts the bulk Fermi offset, so intercepts alone do not give an exact metal work-function difference.',
      ),
      topic('Quick selection by operating regime', 'L9 p10–20'),
      formula(
        String.raw`V_A<0:\ C_{\rm total}\approx C_J`,
        'Reverse bias: little injected minority charge.',
      ),
      formula(
        String.raw`V_A\gg V_T:\ C_D\approx\tau_{\rm eff}I/V_T`,
        'Strong forward bias: diffusion storage can dominate.',
      ),
      formula(
        String.raw`\omega_{RC}=1/(r_dC_{\rm total})`,
        'Local small-signal RC corner estimate.',
      ),
      note(
        'Track A in cm², ε_s in F/cm, N in cm⁻³ and W in cm. An inverse-square C–V intercept is an extrapolation, not a forward-bias measurement.',
      ),
    ].join(''),
  },
  {
    subtitle: 'Lecture 10 · diode applications and light',
    left: [
      topic('16. PN junction as temperature sensor', 'L10 p7'),
      formula(
        String.raw`I=I_S(T)\left(e^{V_F/(\eta V_T)}-1\right)`,
        'Forward diode current; η is ideality factor.',
      ),
      formula(
        String.raw`V_F=\eta V_T\ln\!\left(1+\frac{I}{I_S(T)}\right)`,
        'At fixed current, read temperature from voltage.',
      ),
      formula(
        String.raw`I_S(T)\propto T^3e^{-E_g/(k_BT)}`,
        'Illustrative silicon temperature trend when transport factors are fixed.',
      ),
      formula(
        String.raw`S_T=\left.\frac{dV_F}{dT}\right|_I`,
        'Calibrated voltage sensitivity at fixed current.',
      ),
      note(
        'At ordinary bias a silicon diode usually needs less V_F as T rises. Calibrate at a fixed current; I_S(T) and series resistance are device-dependent.',
      ),
      topic('17. Varactor: reverse-bias tuning', 'L10 p8'),
      formula(
        String.raw`C_j(V_r)=C_0\left(1+\frac{V_r}{V_{bi}}\right)^{-n}`,
        'Useful offset form; stronger reverse bias lowers C.',
      ),
      formula(String.raw`n=\frac1{m+2}`, 'Graded profile N(x) ∝ x^m.'),
      formula(
        String.raw`m=1\Rightarrow n=\tfrac13,\quad m=0\Rightarrow n=\tfrac12`,
        'Linear grade versus abrupt junction.',
      ),
      formula(String.raw`m=-\tfrac32\Rightarrow n=2`, 'Hyperabrupt junction: stronger tuning.'),
      formula(
        String.raw`C_j\propto V_r^{-n}\quad(V_r\gg V_{bi})`,
        'Slide’s high-reverse-bias power law.',
      ),
      formula(
        String.raw`\omega_0=\frac1{\sqrt{LC_j}},\quad f_0=\frac1{2\pi\sqrt{LC_j}}`,
        'LC oscillator frequency rises as C_j falls.',
      ),
      formula(
        String.raw`\frac{f_0(V_r)}{f_0(0)}=\left(1+\frac{V_r}{V_{bi}}\right)^{n/2}`,
        'Frequency tuning ratio at fixed inductance.',
      ),
      topic('18. Photodiode collection', 'L10 p9–10, 13'),
      formula(String.raw`E_\gamma=h\nu=hc/\lambda`, 'Photon energy and wavelength.'),
      formula(
        String.raw`\lambda(\mu\mathrm m)\approx\frac{1.24}{E_\gamma(\mathrm{eV})}`,
        'Quick optical wavelength conversion.',
      ),
      formula(String.raw`E_\gamma\ge E_g`, 'Photon must meet the gap for band-to-band absorption.'),
      formula(
        String.raw`\lambda_c(\mu\mathrm m)\approx1.24/E_g(\mathrm{eV})`,
        'Approximate absorption cutoff wavelength.',
      ),
      formula(
        String.raw`I_L\approx-qA(L_p+W+L_n)G_L`,
        'Uniform-generation collection estimate; sign opposes diode current.',
        true,
      ),
      formula(
        String.raw`I(V)=I_0(e^{V/V_T}-1)+I_L`,
        'Illuminated diode using signed light current I_L < 0.',
      ),
      note(
        'Photocarriers formed in depletion are field swept. In neutral regions, minority carriers generally need to diffuse to the junction before recombining.',
      ),
    ].join(''),
    right: [
      topic('19. Solar-cell I–V and open circuit', 'L10 p10–12'),
      formula(
        String.raw`I(V)=I_0(e^{V/V_T}-1)-I_{\rm ph}`,
        'Illuminated diode with current delivered to load negative.',
      ),
      formula(
        String.raw`V_{OC}=V_T\ln\!\left(1+\frac{I_{\rm ph}}{I_0}\right)`,
        'Open circuit: terminal current is zero.',
      ),
      formula(
        String.raw`I_{\rm diode}(V_{OC})=I_{\rm ph}`,
        'At open circuit forward and light currents balance.',
      ),
      formula(String.raw`I_{SC}\approx I_{\rm ph}`, 'Short-circuit current magnitude.'),
      formula(String.raw`P_{\rm out}=-VI(V)`, 'Electrical power in the generating quadrant.'),
      formula(
        String.raw`FF=\frac{P_{\max}}{V_{OC}I_{SC}}`,
        'Fill factor: maximum power versus ideal rectangle.',
      ),
      formula(
        String.raw`\left.\frac{dP_{\rm out}}{dV}\right|_{V_{\rm MP}}=0`,
        'Maximum-power point condition.',
      ),
      formula(
        String.raw`I(V_{\rm MP})+V_{\rm MP}\frac{I_0}{V_T}e^{V_{\rm MP}/V_T}=0`,
        'Solve for maximum power in the ideal model.',
        true,
      ),
      formula(
        String.raw`P_{\max}=V_{\rm MP}|I(V_{\rm MP})|`,
        'Power at the load-matched operating point.',
      ),
      note(
        'Use current density J throughout if area is unknown; then output power is per area. Series and shunt losses lower a real cell’s fill factor.',
      ),
      topic('20. LED emission', 'L10 p14'),
      formula(
        String.raw`E_\gamma\approx E_g`,
        'Direct-gap radiative recombination sets photon energy.',
      ),
      formula(
        String.raw`\lambda(\mu\mathrm m)\approx\frac{1.24}{E_g(\mathrm{eV})}`,
        'Approximate peak LED wavelength.',
      ),
      formula(
        String.raw`E_g(\mathrm{eV})\approx1240/\lambda(\mathrm{nm})`,
        'Estimate band gap from peak LED color.',
      ),
      formula(
        String.raw`R_\gamma\approx\eta_{\rm rad}\frac{I}{q}`,
        'Internal photon-generation rate from radiative fraction.',
      ),
      formula(
        String.raw`\eta_{\rm ext}=\eta_{\rm rad}\eta_{\rm extract}`,
        'External output also needs photon escape.',
      ),
      note(
        'Visible anchors: red ~650 nm, green ~570 nm, blue ~450 nm. Direct-band-gap materials emit efficiently; extraction losses reduce external output.',
      ),
      topic('Application checks', 'L10 p7–14'),
      note(
        'Temperature sensor: hold I fixed. Varactor: reverse bias only. Photodiode: collected light current opposes dark diode current. Solar cell: V &gt; 0 with I &lt; 0 delivers power.',
      ),
    ].join(''),
  },
  {
    subtitle: 'Lectures 11–12 · MOS capacitor and C–V',
    left: [
      topic('21. MOS stack and flat band', 'L11 p4–11; L12 p4'),
      formula(
        String.raw`C_{ox}'=\frac{\varepsilon_{ox}}{t_{ox}},\quad C_{ox}=AC_{ox}'`,
        'Oxide capacitance per area and total capacitance.',
      ),
      formula(String.raw`\varepsilon_{ox}\approx3.9\varepsilon_0`, 'Silicon dioxide permittivity.'),
      formula(String.raw`Q_G'+Q_s'+Q_{ox}'=0`, 'Gate and semiconductor charge balance.'),
      formula(
        String.raw`V_{FB}=\frac{\Phi_M-\Phi_S}{q}-\frac{Q_{ox}'}{C_{ox}'}`,
        'Flat-band voltage with effective fixed oxide charge.',
        true,
      ),
      formula(
        String.raw`V_G=V_{FB}+\psi_s-\frac{Q_s'}{C_{ox}'}`,
        'Gate-voltage partition for p-type substrate sign convention.',
        true,
      ),
      formula(String.raw`V_{ox}=-Q_s'/C_{ox}'`, 'Oxide drop from semiconductor sheet charge.'),
      formula(
        String.raw`|\mathcal E_{ox}|=|Q_s'|/\varepsilon_{ox}`,
        'Oxide field magnitude from Gauss’s law.',
      ),
      formula(
        String.raw`E_C(0)-E_C(\infty)=-q\psi_s`,
        'Surface band bending for electrostatic potential ψ_s.',
      ),
      note(
        'Primes denote charge or capacitance per area. Work-function differences in eV are numerically volts after division by q. At flat band, ψ_s = 0.',
      ),
      topic('22. P-type accumulation and depletion', 'L11 p12; L12 p5–13'),
      formula(
        String.raw`V_G<V_{FB}\Rightarrow\text{hole accumulation}`,
        'Negative gate relative to flat band attracts holes.',
      ),
      formula(
        String.raw`V_{FB}<V_G<V_T^{\rm MOS}\Rightarrow\text{depletion}`,
        'Positive gate repels holes and exposes acceptors.',
      ),
      formula(
        String.raw`W=\sqrt{\frac{2\varepsilon_{Si}\psi_s}{qN_A}}`,
        'Depletion width from Poisson’s equation.',
      ),
      formula(
        String.raw`\psi_s=qN_AW^2/(2\varepsilon_{Si})`,
        'Invert width relation in depletion.',
      ),
      formula(String.raw`|\mathcal E_s(0)|=qN_AW/\varepsilon_{Si}`, 'Peak silicon surface field.'),
      formula(
        String.raw`Q_{dep}'=-qN_AW=-\sqrt{2q\varepsilon_{Si}N_A\psi_s}`,
        'Negative fixed-ion charge per area in p-type Si.',
        true,
      ),
      formula(
        String.raw`Q_s'\approx Q_{dep}'\quad(V_{FB}<V_G<V_T^{\rm MOS})`,
        'Before inversion charge matters.',
      ),
      formula(
        String.raw`V_G=V_{FB}+\psi_s+\frac{\sqrt{2q\varepsilon_{Si}N_A\psi_s}}{C_{ox}'}`,
        'Depletion gate-voltage relation, ignoring inversion charge.',
        true,
      ),
    ].join(''),
    right: [
      topic('23. Strong inversion and threshold', 'L12 p14–21'),
      formula(
        String.raw`\phi_F=V_T\ln(N_A/n_i)`,
        'Positive bulk Fermi-potential magnitude for p-type Si.',
      ),
      formula(String.raw`\psi_{s,T}=2\phi_F`, 'Strong-inversion threshold surface potential.'),
      formula(
        String.raw`n_s\approx(n_i^2/N_A)e^{\psi_s/V_T}`,
        'Surface electrons rise exponentially with band bending.',
      ),
      formula(String.raw`n_s(2\phi_F)\approx N_A`, 'Strong-inversion surface criterion.'),
      formula(
        String.raw`W_T=\sqrt{\frac{4\varepsilon_{Si}\phi_F}{qN_A}}`,
        'Approximate maximum depletion width at threshold.',
      ),
      formula(
        String.raw`Q_{dep,T}'=-\sqrt{4q\varepsilon_{Si}N_A\phi_F}`,
        'Threshold depletion sheet charge.',
      ),
      formula(
        String.raw`V_T^{\rm MOS}=V_{FB}+2\phi_F+\frac{\sqrt{4q\varepsilon_{Si}N_A\phi_F}}{C_{ox}'}`,
        'Threshold voltage for ideal p-type substrate.',
        true,
      ),
      formula(
        String.raw`Q_{inv}'\approx-C_{ox}'(V_G-V_T^{\rm MOS})`,
        'Electron inversion charge above threshold.',
      ),
      note(
        'Here V_T without a MOS superscript is thermal voltage; V_T^MOS means transistor threshold. Added gate bias above threshold mainly increases inversion charge.',
      ),
      topic('24. MOS capacitance versus frequency', 'L12 p22–29'),
      formula(
        String.raw`C_{dep}'=\varepsilon_{Si}/W`,
        'Incremental silicon depletion capacitance per area.',
      ),
      formula(String.raw`C'=\left|dQ_G'/dV_G\right|`, 'Small-signal gate-charge slope.'),
      formula(
        String.raw`\frac1{C'}=\frac1{C_{ox}'}+\frac1{C_{dep}'}`,
        'Oxide and depletion regions act in series.',
      ),
      formula(
        String.raw`C'_{min}=\left(\frac1{C_{ox}'}+\frac{W_T}{\varepsilon_{Si}}\right)^{-1}`,
        'High-frequency inversion limit: depletion stays near W_T.',
        true,
      ),
      formula(
        String.raw`L_D=\sqrt{\varepsilon_{Si}V_T/(qN_A)}`,
        'Extrinsic Debye screening length at flat band.',
      ),
      formula(
        String.raw`C'_{FB}=\left(\frac1{C_{ox}'}+\frac{L_D}{\varepsilon_{Si}}\right)^{-1}`,
        'Flat-band capacitance below C_ox due to finite screening.',
        true,
      ),
      formula(
        String.raw`C'_{LF,inv}\to C_{ox}'`,
        'Low-frequency minority carriers can follow the AC signal.',
      ),
      formula(
        String.raw`C'_{acc}\to C_{ox}'`,
        'Accumulation charge sits near the oxide interface.',
      ),
      formula(String.raw`i_{ac}=C\,dv_{ac}/dt`, 'AC measurement at a chosen DC gate bias.'),
      note(
        'For n-type Si reverse the gate-voltage polarities and majority/minority carriers. Low- versus high-frequency inversion depends on electron or hole supply, not just DC bias.',
      ),
    ].join(''),
  },
];

const pageMarkup = pages.map(
  (page, index) =>
    `<section class="page"><header><h1>ECE 121B &nbsp; Four-page cheat sheet</h1><div class="meta"><span>${page.subtitle}</span><span>Professor Emaminejad / Lectures 1–8</span></div></header><div class="columns"><div class="column">${page.left}</div><div class="column">${page.right}</div></div><footer><span>L# p# = lecture / PDF page. HW# P# = homework problem. Check assumptions.</span><span>${index + 1}/4</span></footer></section>`,
);
const supplementMarkup = laterPages.map(
  (page, index) =>
    `<section class="page"><header><h1>ECE 121B &nbsp; Cheat sheet supplement</h1><div class="meta"><span>${page.subtitle}</span><span>Professor Emaminejad / Lectures 9–12 · HW3</span></div></header><div class="columns"><div class="column">${page.left}</div><div class="column">${page.right}</div></div><footer><span>L# p# = lecture / PDF page. HW# P# = homework problem. Check assumptions.</span><span>${index + 5}/8</span></footer></section>`,
);
const documentStart = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<link rel="stylesheet" href="../../node_modules/katex/dist/katex.min.css" />
<style>
@page { size: letter; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { color: #173548; font-family: Georgia, 'Times New Roman', serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 8.5in; height: 10.9in; padding: .33in .33in .34in; position: relative; overflow: hidden; }
header { height: .48in; border-bottom: 1px solid #173548; margin-bottom: .14in; }
header h1 { margin: 0 0 2px; font-size: 14pt; letter-spacing: .01em; font-weight: 700; }
header .meta { display: flex; justify-content: space-between; color: #536570; font-size: 8.4pt; }
.page.eight header h1 { font-size: 12.5pt; margin-bottom: 1px; }
.page.eight header .meta { font-size: 7.7pt; }
.page.eight header .meta strong { color: #176d72; }
.page.eight header .route { margin-top: 2px; color: #334f5b; font: 7pt Georgia, 'Times New Roman', serif; }
.page.eight .topic { border-bottom-color: #87b4b1; }
.page.eight .topic strong { font-size: 10.2pt; }
.columns { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: .20in; height: 9.66in; }
.column { min-width: 0; }
.topic { margin: 6px 0 3px; padding-bottom: 3px; border-bottom: 1px solid #173548; }
.topic:first-child { margin-top: 0; }
.topic strong { display: block; color: #176d72; font-size: 10pt; letter-spacing: .012em; }
.topic span { display: block; margin-top: 3px; color: #536570; font-size: 7pt; }
.formula { margin: 4px 0 6px; break-inside: avoid; }
.formula .math { font-size: 9.7pt; white-space: nowrap; line-height: 1.35; }
.formula.compact .math { font-size: 8.5pt; }
.formula .purpose { margin-top: 1px; color: #536570; font-size: 7.4pt; line-height: 1.2; }
.note { margin: 5px 0 7px; padding: 5px 7px; background: #edf5f4; border-left: 2px solid #176d72; color: #334f5b; font-size: 7.5pt; line-height: 1.25; }
.mini-graphs { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 5px; margin: 6px 0 3px; }
.mini-graph { min-width: 0; border: .5px solid #cbdadd; padding: 3px 2px 1px; }
.mini-graph strong { display: block; color: #176d72; font-size: 7.4pt; padding-left: 3px; }
.mini-graph svg { display: block; width: 100%; height: auto; }
.mini-graph .grid { stroke: #dce6e7; stroke-width: .65; }
.mini-graph .axis { fill: none; stroke: #526670; stroke-width: .9; }
.mini-graph .electron-line, .mini-graph .hole-line { fill: none; stroke-width: 1.55; }
.mini-graph .electron-line { stroke: #2672d9; }
.mini-graph .hole-line { stroke: #d56138; }
.mini-graph .tick { fill: #536570; font: 7px Arial, sans-serif; }
.mini-graph .axis-title, .mini-graph .legend { fill: #173548; font: 7px Arial, sans-serif; }
.case-list { margin: 6px 0; padding: 5px 7px; background: #edf5f4; border-left: 2px solid #176d72; color: #334f5b; font-size: 7.3pt; line-height: 1.3; }
.case-list div + div { margin-top: 4px; }
.case-list .katex { font-size: .94em; }
.band-diagrams { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 4px; margin: 4px 0; }
.band-diagrams svg { display: block; width: 100%; height: auto; border: .5px solid #cbdadd; }
.temperature-graph { margin: 5px 0 0; border: .5px solid #cbdadd; padding: 3px 3px 0; }
.temperature-graph strong { display: block; color: #176d72; font-size: 7.4pt; padding-left: 3px; }
.temperature-graph svg { display: block; width: 100%; height: auto; }
.temperature-graph .grid { stroke: #dce6e7; stroke-width: .65; }
.temperature-graph .axis { fill: none; stroke: #526670; stroke-width: .9; }
.temperature-graph .tick { fill: #536570; font: 7px Arial, sans-serif; }
.temperature-graph .axis-title { fill: #173548; font: 7px Arial, sans-serif; }
.band-diagrams .band-title { fill: #176d72; font: bold 10px Georgia, serif; }
.band-diagrams .band-label { fill: #173548; font: 10.5px Georgia, serif; }
.band-diagrams .band-interface { stroke: #9eb7bd; stroke-width: .8; stroke-dasharray: 2 2; }
.band-diagrams .band-vacuum { fill: none; stroke: #7d8a90; stroke-width: 1.1; stroke-dasharray: 3 2; }
.band-diagrams .band-fermi { stroke: #7654ba; stroke-width: 1.2; stroke-dasharray: 4 2; }
.band-diagrams .band-ec { fill: none; stroke: #2672d9; stroke-width: 1.7; }
.band-diagrams .band-ev { fill: none; stroke: #14875f; stroke-width: 1.7; }
.band-diagrams .band-bracket { fill: none; stroke: #536570; stroke-width: 1; }
footer { position: absolute; bottom: .17in; left: .33in; right: .33in; padding-top: 3px; border-top: .5px solid #173548; display: flex; justify-content: space-between; font-size: 7pt; }
</style></head><body>`;

const pdfPath = resolve(output, 'ece121b-four-page-cheat-sheet.pdf');
const chrome = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const pagePdfs = [];
for (const [index, markup] of pageMarkup.entries()) {
  const htmlPath = resolve(temp, `ece121b-cheat-sheet-page-${index + 1}.html`);
  const pagePdf = resolve(temp, `ece121b-cheat-sheet-page-${index + 1}.pdf`);
  writeFileSync(htmlPath, `${documentStart}${markup}</body></html>`);
  rmSync(pagePdf, { force: true });
  const result = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--no-pdf-header-footer',
      `--user-data-dir=${resolve(temp, `chrome-profile-full-${index + 1}`)}`,
      `--print-to-pdf=${pagePdf}`,
      pathToFileURL(htmlPath).href,
    ],
    { encoding: 'utf8', timeout: 60000 },
  );
  if (result.error || result.status !== 0 || !existsSync(pagePdf)) {
    throw new Error(
      `Chrome PDF export failed on page ${index + 1}: ${result.error?.message ?? result.stderr}`,
    );
  }
  pagePdfs.push(pagePdf);
}
const python =
  process.env.PYTHON ||
  resolve(
    process.env.USERPROFILE ?? '',
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  );
rmSync(pdfPath, { force: true });
const result = spawnSync(
  python,
  [
    '-c',
    'from pypdf import PdfWriter; import sys; writer = PdfWriter(); [writer.append(path) for path in sys.argv[2:]]; writer.write(sys.argv[1])',
    pdfPath,
    ...pagePdfs,
  ],
  { encoding: 'utf8', timeout: 60000 },
);
if (result.error || result.status !== 0 || !existsSync(pdfPath)) {
  throw new Error(`PDF merge failed: ${result.error?.message ?? result.stderr}`);
}
const pdf = getDocument({ data: new Uint8Array(readFileSync(pdfPath)), verbosity: 0 });
try {
  if ((await pdf.promise).numPages !== 4)
    throw new Error('The expanded sheet must have four pages.');
} finally {
  await pdf.destroy();
}
copyFileSync(pdfPath, resolve(publicGuides, 'ece121b-four-page-cheat-sheet.pdf'));
const shortOriginal = resolve(publicGuides, 'ece121b-midterm-formula-sheet.pdf');
copyFileSync(shortOriginal, resolve(publicGuides, 'ece121b-short-cheat-sheet.pdf'));
copyFileSync(shortOriginal, resolve(output, 'ece121b-short-cheat-sheet.pdf'));

const eightPageSections = [
  ['Carrier statistics & doping', 'Start with equilibrium, occupation, carrier densities, then charge neutrality.'],
  ['Transport & continuity', 'Choose drift or diffusion for current; use continuity for time-dependent density.'],
  ['PN junction electrostatics', 'Find built-in voltage, depletion width, electric field, then junction capacitance.'],
  ['Contacts & diode DC', 'Identify contact type and bias before choosing ideal or nonideal current laws.'],
  ['Minority charge & recovery', 'Use boundary excess, spatial profile, stored charge, then charge control.'],
  ['Small signal & C-V', 'For AC use differential conductance and capacitance; for doping use 1/C² slope.'],
  ['Sensors, light & energy', 'Select the device: temperature sensor, varactor, photodiode, solar cell, or LED.'],
  ['MOS capacitor', 'Follow flat band, accumulation, depletion, inversion, and frequency response.'],
];
const eightPageMarkup = [...pages, ...laterPages].map((page, index) => {
  const [title, route] = eightPageSections[index];
  let left = page.left;
  let right = page.right;
  if (index === 5) {
    const cvMarker = '<div class="topic"><strong>15. PN and Schottky depletion';
    const schottkyMarker = '<div class="topic"><strong>Schottky contact:';
    const cvStart = left.indexOf(cvMarker);
    const schottkyStart = right.indexOf(schottkyMarker);
    if (cvStart < 0 || schottkyStart < 0) throw new Error('Could not group page 6 formulas.');
    const cv = left.slice(cvStart);
    const workedChecks = right.slice(0, schottkyStart);
    left = left.slice(0, cvStart) + workedChecks;
    right = cv + right.slice(schottkyStart);
  }
  return `<section class="page eight"><header><h1>ECE 121B &nbsp; Formula reference</h1><div class="meta"><strong>${String(index + 1).padStart(2, '0')} / 08 &nbsp; ${title}</strong><span>Lectures 1-12 &nbsp; / &nbsp; HW 1-3</span></div><div class="route">${route}</div></header><div class="columns"><div class="column">${left}</div><div class="column">${right}</div></div><footer><span>L# p# = lecture / PDF page. HW# P# = homework problem. Verify assumptions and units.</span><span>${index + 1}/8</span></footer></section>`;
});
const eightPagePdfs = [];
for (const [index, markup] of eightPageMarkup.entries()) {
  const htmlPath = resolve(temp, `ece121b-eight-page-${index + 1}.html`);
  const pagePdf = resolve(temp, `ece121b-eight-page-${index + 1}.pdf`);
  writeFileSync(htmlPath, `${documentStart}${markup}</body></html>`);
  rmSync(pagePdf, { force: true });
  const result = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--no-pdf-header-footer',
      `--user-data-dir=${resolve(temp, `chrome-profile-eight-${index + 1}`)}`,
      `--print-to-pdf=${pagePdf}`,
      pathToFileURL(htmlPath).href,
    ],
    { encoding: 'utf8', timeout: 60000 },
  );
  if (result.error || result.status !== 0 || !existsSync(pagePdf)) {
    throw new Error(
      `Chrome PDF export failed on eight-page edition, page ${index + 1}: ${result.error?.message ?? result.stderr}`,
    );
  }
  eightPagePdfs.push(pagePdf);
}
const eightPagePdfPath = resolve(output, 'ece121b-eight-page-cheat-sheet.pdf');
rmSync(eightPagePdfPath, { force: true });
const eightPageMerge = spawnSync(
  python,
  [
    '-c',
    'from pypdf import PdfWriter; import sys; writer = PdfWriter(); [writer.append(path) for path in sys.argv[2:]]; writer.write(sys.argv[1])',
    eightPagePdfPath,
    ...eightPagePdfs,
  ],
  { encoding: 'utf8', timeout: 60000 },
);
if (eightPageMerge.error || eightPageMerge.status !== 0 || !existsSync(eightPagePdfPath)) {
  throw new Error(
    `Eight-page PDF merge failed: ${eightPageMerge.error?.message ?? eightPageMerge.stderr}`,
  );
}
const eightPagePdf = getDocument({
  data: new Uint8Array(readFileSync(eightPagePdfPath)),
  verbosity: 0,
});
try {
  if ((await eightPagePdf.promise).numPages !== 8)
    throw new Error('The new cheat sheet must have eight pages.');
} finally {
  await eightPagePdf.destroy();
}
copyFileSync(eightPagePdfPath, resolve(publicGuides, 'ece121b-eight-page-cheat-sheet.pdf'));
console.log('Built eight-page, four-page and short cheat sheet PDFs.');
