// Schematic answer-key drawings. Coordinates are deliberately not numerical fits.
const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const T = (x, y, s, c = 'ink', anchor = 'start', size = 15) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${c}" font-size="${size}">${esc(s)}</text>`;
const P = (d, c = 'blue', dash = false, width = 3) =>
  `<path d="${d}" fill="none" class="${c}" stroke-width="${width}"${dash ? ' stroke-dasharray="7 5"' : ''}/>`;
const L = (x1, y1, x2, y2, c = 'guide', dash = false, width = 1.5) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}" stroke-width="${width}"${dash ? ' stroke-dasharray="5 5"' : ''}/>`;
const R = (x, y, w, h, fill = '#f0f5f7', stroke = 'none') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}"/>`;
const A = (x, y, w, h, xlabel, ylabel) =>
  L(x, y, x, y + h, 'axis', false, 2) +
  L(x, y + h, x + w, y + h, 'axis', false, 2) +
  T(x + w - 2, y + h + 25, xlabel, 'axis-text', 'end', 15) +
  T(x + 8, y - 8, ylabel, 'axis-text', 'start', 15);
const panel = (x, y, w, h, title) =>
  R(x, y, w, h, '#fff', '#cfdae0') + T(x + 12, y + 23, title, 'panel-title', 'start', 17);
const band = (x0, x1, y0, y1, c = 'blue') =>
  P(`M${x0} ${y0} C${x0 + 55} ${y0} ${x1 - 55} ${y1} ${x1} ${y1}`, c);
const dot = (x, y, c = '#2672d9', r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const fig = (body) => `<svg viewBox="0 0 920 330" role="img">${body}</svg>`;
const mosBands = (substrate) =>
  fig(
    ['Flat band', 'Accumulation', 'Depletion', 'Inversion']
      .map((mode, k) => {
        const x = 12 + 227 * k;
        const p = substrate === 'p';
        const bend = (p ? [0, -36, 26, 61] : [0, 36, -26, -54])[k];
        const bulkEf = p ? 185 : 120;
        const gateEf = bulkEf + [0, p ? -32 : 32, p ? 22 : -21, p ? 53 : -47][k];
        const ecBulk = 91;
        const evBulk = 215;
        const ecSurface = ecBulk + bend;
        const evSurface = evBulk + bend;
        return (
          panel(x, 17, 215, 282, mode) +
          R(x + 12, 56, 39, 192, '#e8eef3') +
          R(x + 51, 56, 48, 192, '#fff0d8') +
          R(x + 99, 56, 103, 192, '#f4f9f7') +
          L(x + 51, 57, x + 51, 248, 'guide', true) +
          L(x + 99, 57, x + 99, 248, 'guide', true) +
          L(x + 12, gateEf, x + 49, gateEf, 'purple', true, 2) +
          L(x + 100, bulkEf, x + 200, bulkEf, 'purple', true, 2) +
          P(`M${x + 52} ${58 + bend / 3} L${x + 98} ${58 + bend / 2}`, 'gray', true, 2) +
          P(`M${x + 52} ${81 + bend / 3} L${x + 98} ${81 + bend / 2}`, 'blue', false, 2) +
          P(`M${x + 52} ${233 + bend / 3} L${x + 98} ${233 + bend / 2}`, 'orange', false, 2) +
          band(x + 100, x + 200, ecSurface, ecBulk, 'blue') +
          band(x + 100, x + 200, evSurface, evBulk, 'orange') +
          T(x + 17, 274, 'M', 'ink') +
          T(x + 69, 274, 'oxide', 'ink', 'middle') +
          T(x + 151, 274, `${substrate}-Si`, 'ink', 'middle') +
          T(x + 103, 48, 'Evac', 'gray') +
          T(x + 150, bulkEf - 7, 'EF,Si', 'purple', 'start', 11) +
          T(x + 16, gateEf - 7, 'EF,M', 'purple', 'start', 11) +
          (k === 0 ? T(x + 143, 82, 'EC', 'blue') + T(x + 143, 239, 'EV', 'orange') : '') +
          T(
            x + 110,
            294,
            k === 0 ? 'ψs = 0' : k === 3 ? '|ψs| ≈ 2|φF|' : `ψs ${bend > 0 ? '>' : '<'} 0`,
            'ink',
            'start',
            11,
          )
        );
      })
      .join(''),
  );

export const figures = [
  {
    n: 1,
    title: 'Metal, semiconductor, and insulator bands',
    lecture: 'L2',
    why: 'A metal has available states at its Fermi level. A semiconductor has a modest forbidden gap; an insulator has a much larger gap. The gap controls thermal carrier creation, while occupation of available states controls whether current can flow.',
    eq: String.raw`E_g=E_C-E_V,\qquad E_{g,\mathrm{Si}}\simeq1.12\,\mathrm{eV}\ (300\,\mathrm K)`,
    drawing: fig(
      [
        ...[
          [35, 'Metal', 0],
          [335, 'Silicon', 1],
          [635, 'Insulator', 2],
        ].map(
          ([x, title, kind]) =>
            panel(x, 15, 250, 290, title) +
            L(x + 28, 160, x + 220, 160, 'purple', true, 2) +
            T(x + 215, 154, 'EF', 'purple', 'end') +
            (kind === 0
              ? R(x + 42, 111, 166, 85, '#e6f1fa') + T(x + 53, 91, 'partly filled band', 'blue')
              : L(x + 42, kind === 1 ? 93 : 53, x + 208, kind === 1 ? 93 : 53, 'blue', false, 3) +
                L(
                  x + 42,
                  kind === 1 ? 226 : 263,
                  x + 208,
                  kind === 1 ? 226 : 263,
                  'orange',
                  false,
                  3,
                ) +
                T(x + 215, kind === 1 ? 88 : 48, 'EC', 'blue', 'end') +
                T(x + 215, kind === 1 ? 221 : 258, 'EV', 'orange', 'end') +
                L(x + 75, kind === 1 ? 98 : 58, x + 75, kind === 1 ? 222 : 259, 'guide', true) +
                T(x + 83, 177, kind === 1 ? 'Eg ≈ 1.12 eV' : 'large Eg', 'ink')),
        ),
      ].join(''),
    ),
  },
  {
    n: 2,
    title: 'Fermi–Dirac occupation versus energy',
    lecture: 'L2–3',
    why: 'Temperature broadens the occupation transition about the same energy axis. Every temperature curve crosses f = 1/2 at EF; it is the probability curve that spreads, not the energy axis.',
    eq: String.raw`f(E)=\frac{1}{1+e^{(E-E_F)/k_BT}},\qquad f(E_F)=\tfrac12`,
    drawing: fig(
      A(105, 32, 720, 243, 'Energy E →', 'f(E)') +
        L(105, 154, 825, 154, 'guide', true) +
        L(465, 32, 465, 275, 'guide', true) +
        P(
          'M115 48 C300 48 424 48 448 115 C460 145 470 185 482 249 C503 266 650 266 815 266',
          'blue',
        ) +
        P('M115 59 C290 66 394 105 465 154 C536 207 650 254 815 261', 'orange') +
        T(476, 149, 'f = 1/2', 'ink') +
        T(465, 302, 'EF', 'purple', 'middle') +
        T(247, 86, 'low T: sharp step', 'blue') +
        T(600, 205, 'higher T: broader', 'orange') +
        T(88, 50, '1', 'ink') +
        T(88, 278, '0', 'ink'),
    ),
  },
  {
    n: 3,
    title: 'Available states × occupation = carrier spectra',
    lecture: 'L2–3',
    why: 'Carrier density is the area under the product curve, not under the density-of-states curve alone. Electrons use gC(E)f(E); holes use gV(E)[1−f(E)].',
    eq: String.raw`n=\int_{E_C}^{\infty}g_C(E)f(E)\,dE,\quad p=\int_{-\infty}^{E_V}g_V(E)[1-f(E)]\,dE`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Conduction electrons') +
        panel(470, 15, 430, 285, 'Valence holes') +
        A(65, 56, 340, 194, 'E →', 'density') +
        A(515, 56, 340, 194, 'E →', 'density') +
        L(165, 56, 165, 250, 'guide', true) +
        L(755, 56, 755, 250, 'guide', true) +
        P('M165 248 C214 216 262 163 399 80', 'blue') +
        P('M165 248 C218 166 244 150 264 188 C286 234 343 246 400 249', 'green') +
        P('M520 80 C653 163 705 216 755 248', 'orange') +
        P('M520 249 C579 246 628 234 656 188 C677 150 706 166 755 248', 'green') +
        T(160, 270, 'EC', 'blue', 'middle') +
        T(755, 270, 'EV', 'orange', 'middle') +
        T(310, 102, 'gC(E)', 'blue') +
        T(265, 204, 'gC f · area = n', 'green') +
        T(556, 102, 'gV(E)', 'orange') +
        T(545, 204, 'gV(1−f) · area = p', 'green') +
        T(135, 82, 'f falls with E', 'purple') +
        T(727, 82, '1−f rises with E', 'purple', 'end'),
    ),
  },
  {
    n: 4,
    title: 'Carrier concentration versus temperature',
    lecture: 'L2–3',
    why: 'Low-temperature freeze-out leaves dopants partly neutral. In the extrinsic region, majority carriers roughly equal net ionized dopants. At high temperature, intrinsic generation overtakes doping.',
    eq: String.raw`n_i\simeq\sqrt{N_CN_V}\,e^{-E_g/(2k_BT)},\qquad n_{\mathrm{majority}}\simeq N_{\mathrm{net}}\ \text{in the extrinsic range}`,
    drawing: fig(
      A(100, 33, 735, 240, 'Temperature T →', 'log carrier density') +
        R(103, 38, 210, 232, '#edf4fb') +
        R(313, 38, 265, 232, '#f4f8ed') +
        R(578, 38, 255, 232, '#fff2e8') +
        P(
          'M112 245 C198 242 257 174 313 148 C405 145 492 145 578 145 C660 140 734 86 829 49',
          'blue',
        ) +
        P('M113 269 C395 268 548 229 628 164 C703 107 769 63 829 49', 'orange', true) +
        T(200, 62, 'freeze-out', 'ink', 'middle') +
        T(445, 62, 'extrinsic', 'ink', 'middle') +
        T(700, 62, 'intrinsic', 'ink', 'middle') +
        T(435, 136, '≈ ND − NA (n-type)', 'blue') +
        T(685, 204, 'ni(T)', 'orange') +
        T(310, 298, 'dopants ionize', 'ink', 'middle') +
        T(675, 298, 'ni ≳ net doping', 'ink', 'middle'),
    ),
  },
  {
    n: 5,
    title: 'Silicon mobility versus total doping',
    lecture: 'L3–4',
    why: 'More charged impurities generally cause more scattering, lowering mobility. Electron mobility is normally above hole mobility at comparable doping and temperature.',
    eq: String.raw`\sigma=q(n\mu_n+p\mu_p),\qquad \rho=1/\sigma`,
    drawing: fig(
      A(105, 40, 735, 231, 'ND + NA (cm⁻³, log scale) →', 'mobility μ (cm²/V·s)') +
        P('M112 72 C280 75 445 123 826 214', 'blue') +
        P('M112 154 C290 159 476 197 826 253', 'orange') +
        T(130, 63, 'μn', 'blue') +
        T(135, 147, 'μp', 'orange') +
        T(125, 300, '10¹⁴', 'ink') +
        T(450, 300, '10¹⁷', 'ink') +
        T(792, 300, '10²⁰', 'ink') +
        T(680, 71, '300 K · schematic', 'ink') +
        T(645, 110, 'ionized-impurity scattering ↑', 'ink'),
    ),
  },
  {
    n: 6,
    title: 'Mobility versus temperature: competing scattering',
    lecture: 'L3–4',
    why: 'Impurity-limited mobility improves as temperature rises because faster carriers are deflected less. Phonon-limited mobility falls as lattice vibration increases. Matthiessen’s rule combines scattering rates; the total can have a peak.',
    eq: String.raw`\frac1\mu\simeq\frac1{\mu_{\rm impurity}}+\frac1{\mu_{\rm phonon}},\quad \mu_{\rm phonon}\propto T^{-3/2}`,
    drawing: fig(
      A(105, 35, 735, 235, 'Temperature T →', 'log mobility μ') +
        P('M112 238 C315 210 550 120 826 49', 'orange', true) +
        P('M112 49 C333 107 586 192 826 252', 'blue', true) +
        P('M112 237 C275 211 381 140 463 127 C593 129 733 188 826 250', 'green') +
        T(595, 76, 'impurity limit · rises', 'orange') +
        T(585, 220, 'phonon limit · falls', 'blue') +
        T(448, 111, 'total peak', 'green') +
        T(661, 296, '300 K reference', 'ink'),
    ),
  },
  {
    n: 7,
    title: 'Drift velocity versus electric field',
    lecture: 'L3–4',
    why: 'At low field, average drift speed is linear in field with slope μ. At high field, frequent energetic scattering makes speed approach saturation. Electron drift direction is opposite the field; this plot shows speed magnitude.',
    eq: String.raw`|v_d|\simeq\mu|\mathcal E|\ \text{at low field};\qquad J_n=qn\mu_n\mathcal E`,
    drawing: fig(
      A(105, 34, 735, 240, '|electric field| →', '|drift speed|') +
        P('M108 272 C204 196 286 125 414 85 C550 55 683 52 827 52', 'blue') +
        P('M108 272 C220 220 309 171 436 138 C577 114 690 110 827 110', 'orange') +
        L(108, 272, 363, 76, 'guide', true) +
        T(299, 160, 'low-field slope μn', 'blue') +
        T(632, 44, 'electron vsat', 'blue') +
        T(632, 103, 'hole vsat', 'orange') +
        T(570, 231, 'nonlinear high-field region', 'ink'),
    ),
  },
  {
    n: 8,
    title: 'Direct versus indirect gap in E–k space',
    lecture: 'L4',
    why: 'A photon carries little crystal momentum. A direct-gap transition is nearly vertical in E–k; an indirect-gap transition needs a phonon to conserve momentum. This explains why direct-gap materials are effective LEDs and silicon is not.',
    eq: String.raw`E_\gamma\gtrsim E_g,\qquad \lambda(\mu\mathrm m)\simeq1.24/E_\gamma(\mathrm{eV})`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Direct gap') +
        panel(470, 15, 430, 285, 'Indirect gap') +
        A(70, 56, 330, 205, 'k →', 'E') +
        A(520, 56, 330, 205, 'k →', 'E') +
        P('M105 104 Q235 232 365 104', 'blue') +
        P('M105 173 Q235 276 365 173', 'orange') +
        P('M550 94 Q690 226 820 94', 'blue') +
        P('M550 173 Q630 274 820 170', 'orange') +
        L(235, 236, 235, 165, 'green', false, 3) +
        L(630, 241, 690, 176, 'green', false, 3) +
        T(243, 198, 'photon', 'green') +
        T(693, 214, 'phonon + photon', 'green') +
        T(235, 285, 'same k', 'ink', 'middle') +
        T(685, 285, 'different k extrema', 'ink', 'middle'),
    ),
  },
  {
    n: 9,
    title: 'Equilibrium Schottky bands: metal–n and metal–p',
    lecture: 'L5–6',
    why: 'At equilibrium the Fermi level is flat across each contact. The n-type electron barrier is set ideally by metal work function minus electron affinity; the p-type hole barrier complements it. Band bending is the built-in electrostatic drop in semiconductor.',
    eq: String.raw`\Phi_{Bn}=\Phi_M-\chi,\qquad \Phi_{Bp}=E_g-\Phi_{Bn}`,
    drawing: fig(
      [0, 1]
        .map((k) => {
          const x = k ? 470 : 20;
          return (
            panel(x, 15, 430, 285, k ? 'Metal | p-Si' : 'Metal | n-Si') +
            R(x + 35, 51, 95, 211, '#e7eef3') +
            R(x + 130, 51, 262, 211, '#f8fbfd') +
            L(x + 130, 48, x + 130, 264, 'axis') +
            L(x + 35, 158, x + 392, 158, 'purple', true, 2) +
            P(
              `M${x + 130} ${k ? 88 : 104} C${x + 200} ${k ? 88 : 104} ${x + 255} ${k ? 112 : 79} ${x + 383} ${k ? 112 : 79}`,
              'gray',
              true,
              2,
            ) +
            band(x + 130, x + 383, k ? 138 : 72, k ? 103 : 118, 'blue') +
            band(x + 130, x + 383, k ? 235 : 169, k ? 200 : 215, 'orange') +
            T(x + 45, 76, 'metal', 'ink') +
            T(x + 202, 76, k ? 'p-Si' : 'n-Si', 'ink') +
            T(x + 310, 152, 'EF flat', 'purple') +
            T(x + 335, k ? 97 : 112, 'EC', 'blue') +
            T(x + 335, k ? 194 : 209, 'EV', 'orange') +
            T(x + 142, k ? 225 : 64, k ? 'ΦBp' : 'ΦBn', 'green') +
            T(x + 44, 239, 'ΦM', 'ink') +
            T(x + 175, 246, 'χ; qVbi = band bending', 'ink')
          );
        })
        .join(''),
    ),
  },
  {
    n: 10,
    title: 'Schottky contact under forward and reverse bias',
    lecture: 'L5–6',
    why: 'For an n-type rectifying contact, forward bias lowers the semiconductor-to-metal electron barrier and narrows depletion; reverse bias raises the barrier and widens depletion. The metal-to-semiconductor ideal barrier height ΦBn itself is not simply the changing built-in band bend.',
    eq: String.raw`qV_{bi}=\Phi_{Bn}-(E_C-E_F)_{\rm bulk},\qquad W\propto\sqrt{V_{bi}-V_A}`,
    drawing: fig(
      [0, 1]
        .map((k) => {
          const x = k ? 470 : 20;
          const surface = k ? 48 : 104;
          const bulk = 150;
          return (
            panel(x, 15, 430, 285, k ? 'Reverse bias VA < 0' : 'Forward bias VA > 0') +
            R(x + 36, 51, 90, 210, '#e7eef3') +
            L(x + 126, 51, x + 126, 261, 'axis') +
            L(x + 36, 184, x + 392, 184, 'purple', true, 2) +
            band(x + 126, x + 390, surface, bulk, 'blue') +
            band(x + 126, x + 390, surface + 90, bulk + 90, 'orange') +
            T(x + 141, surface - 10, k ? 'larger q(Vbi + VR)' : 'smaller q(Vbi − VA)', 'blue') +
            T(x + 300, 174, 'EF', 'purple') +
            T(x + 320, 245, k ? 'W increases' : 'W decreases', 'ink') +
            T(x + 50, 239, 'metal', 'ink') +
            T(x + 185, 239, 'n-Si', 'ink')
          );
        })
        .join(''),
    ),
  },
  {
    n: 11,
    title: 'PN energy bands: equilibrium and applied bias',
    lecture: 'L6–8',
    why: 'At equilibrium a single flat EF crosses the device. Forward bias reduces the energy barrier and depletion width, increasing injection; reverse bias raises the barrier and widens depletion. Under applied bias, electron and hole quasi-Fermi levels can separate.',
    eq: String.raw`\text{barrier}=q(V_{bi}-V_A),\quad V_A>0\ \text{forward};\qquad W\propto\sqrt{V_{bi}-V_A}`,
    drawing: fig(
      [0, 1, 2]
        .map((k) => {
          const x = 18 + 302 * k;
          const delta = [0, 22, -22][k];
          return (
            panel(x, 16, 286, 283, ['Equilibrium', 'Forward bias', 'Reverse bias'][k]) +
            R(x + 97, 49, 90 + (k === 2 ? 25 : k === 1 ? -22 : 0), 208, '#f0f5f7') +
            band(x + 30, x + 265, 89 + delta, 163, 'blue') +
            band(x + 30, x + 265, 175 + delta, 249, 'orange') +
            (k === 0
              ? L(x + 31, 169, x + 265, 169, 'purple', true, 2) + T(x + 181, 190, 'EF', 'purple')
              : L(x + 31, 169 + delta, x + 97, 169 + delta, 'purple', true, 2) +
                L(x + 188, 169, x + 265, 169, 'purple', true, 2) +
                T(x + 33, 161 + delta, 'EFp', 'purple', 'start', 12) +
                T(x + 229, 190, 'EFn', 'purple', 'start', 12)) +
            T(x + 245, 151, 'EC', 'blue', 'start', 12) +
            T(x + 245, 239, 'EV', 'orange', 'start', 12) +
            T(x + 48, 74, 'p', 'ink') +
            T(x + 240, 74, 'n', 'ink') +
            T(
              x + 130,
              274,
              k === 0 ? 'qVbi; EF flat' : k === 1 ? 'q(Vbi − VA) ↓' : 'q(Vbi + VR) ↑',
              'green',
              'middle',
            ) +
            T(x + 100, 300, k === 0 ? 'W0' : k === 1 ? 'W narrows' : 'W widens', 'ink')
          );
        })
        .join(''),
    ),
  },
  {
    n: 12,
    title: 'PN space charge, electric field, and potential',
    lecture: 'L6',
    why: 'Depleted acceptors contribute negative charge on p; depleted donors contribute positive charge on n. Integrating charge yields the triangular signed field; integrating the negative field yields a smoothly rising potential. The areas of positive and negative charge balance.',
    eq: String.raw`N_Ax_p=N_Dx_n,\qquad |\mathcal E_{max}|=\frac{qN_Ax_p}{\varepsilon_s}=\frac{2(V_{bi}-V_A)}{W}`,
    drawing: fig(
      [0, 1, 2]
        .map((k) => {
          const x = 18 + 302 * k;
          return (
            panel(x, 16, 286, 284, ['ρ(x): charge', 'ℰ(x): field', 'ψ(x): potential'][k]) +
            L(x + 29, 158, x + 263, 158, 'axis') +
            L(x + 105, 42, x + 105, 263, 'guide', true) +
            L(x + 184, 42, x + 184, 263, 'guide', true) +
            (k === 0
              ? R(x + 105, 158, 39, 68, '#f6d9d4') +
                R(x + 144, 103, 40, 55, '#d7e9f8') +
                T(x + 108, 246, '−qNA', 'orange') +
                T(x + 145, 94, '+qND', 'blue')
              : k === 1
                ? P(
                    `M${x + 30} 158 H${x + 105} L${x + 144} 231 L${x + 184} 158 H${x + 263}`,
                    'blue',
                  ) + T(x + 151, 244, '−ℰmax', 'blue')
                : P(
                    `M${x + 30} 223 H${x + 105} Q${x + 123} 223 ${x + 144} 174 Q${x + 165} 119 ${x + 184} 119 H${x + 263}`,
                    'green',
                  ) + T(x + 191, 110, 'Vbi − VA', 'green')) +
            T(x + 100, 280, '−xp', 'ink') +
            T(x + 144, 280, '0', 'ink') +
            T(x + 180, 280, 'xn', 'ink')
          );
        })
        .join(''),
    ),
  },
  {
    n: 13,
    title: 'PN depletion width and capacitance versus reverse bias',
    lecture: 'L6–9',
    why: 'Increasing reverse bias raises the voltage supported by depletion, so W grows approximately as a square root. Because Cj = εsA/W, capacitance falls. Do not confuse this gradual junction-capacitance trend with forward-bias diffusion capacitance.',
    eq: String.raw`W\propto\sqrt{V_{bi}+V_R},\qquad C_J(V_R)=\frac{C_{J0}}{\sqrt{1+V_R/V_{bi}}}`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Width') +
        panel(470, 15, 430, 285, 'Junction capacitance') +
        A(75, 63, 320, 191, 'VR →', 'W') +
        A(525, 63, 320, 191, 'VR →', 'CJ') +
        P('M78 225 C167 177 272 143 391 120', 'blue') +
        P('M528 92 C617 142 717 174 841 198', 'orange') +
        T(83, 218, 'W0', 'blue') +
        T(533, 89, 'CJ0', 'orange') +
        T(165, 284, 'reverse bias widens depletion', 'ink') +
        T(584, 284, 'wider W → smaller CJ', 'ink'),
    ),
  },
  {
    n: 14,
    title: 'Extract doping from the inverse-square C–V line',
    lecture: 'L6, L9',
    why: 'For a one-sided abrupt junction, the reverse-bias data lie on an approximately straight line in 1/Cj² versus forward-positive VA. The negative slope gives light-side doping; extrapolating to zero gives Vbi. Use the known junction area in cm².',
    eq: String.raw`\frac1{C_J^2}=\frac{2(V_{bi}-V_A)}{q\varepsilon_sA^2N_{light}},\quad N_{light}=-\frac2{q\varepsilon_sA^2m}`,
    drawing: fig(
      A(105, 40, 735, 230, '', '1/CJ²') +
        P('M128 68 L600 210', 'blue') +
        P('M600 210 L790 270', 'blue', true) +
        L(600, 39, 600, 270, 'guide', true) +
        L(790, 200, 790, 270, 'guide', true) +
        T(600, 295, 'VA = 0', 'ink', 'middle') +
        T(786, 253, 'Vbi intercept', 'purple', 'end') +
        T(840, 319, 'VA → (forward positive)', 'ink', 'end') +
        T(275, 100, 'measured reverse-bias range', 'blue') +
        T(527, 185, 'm = −2/(q εs A² Nlight)', 'green') +
        T(660, 226, 'extrapolate; do not measure here', 'ink'),
    ),
  },
];

figures.push(
  {
    n: 15,
    title: 'Minority-carrier profiles under PN bias',
    lecture: 'L7–9',
    why: 'Forward bias injects minority electrons into p and minority holes into n. Reverse bias depletes them below their equilibrium values near the junction. Both excesses approach zero deep in the neutral material; the depletion region is not an exponential neutral-base profile.',
    eq: String.raw`\Delta n_p(-x_p)=n_{p0}(e^{V_A/V_T}-1),\quad \Delta p_n(x_n)=p_{n0}(e^{V_A/V_T}-1)`,
    drawing: fig(
      A(75, 28, 775, 240, 'position x →', 'excess density') +
        R(376, 32, 168, 236, '#f0f5f7') +
        L(75, 147, 850, 147, 'axis') +
        L(376, 28, 376, 268, 'guide', true) +
        L(544, 28, 544, 268, 'guide', true) +
        P('M80 147 C220 145 330 111 376 57 M544 63 C591 115 708 145 845 147', 'blue') +
        P('M80 147 C220 149 330 179 376 229 M544 225 C591 176 708 149 845 147', 'orange') +
        T(164, 86, 'forward: Δnp > 0', 'blue') +
        T(608, 86, 'forward: Δpn > 0', 'blue') +
        T(153, 225, 'reverse: Δnp < 0', 'orange') +
        T(605, 225, 'reverse: Δpn < 0', 'orange') +
        T(171, 294, 'p neutral · electrons', 'ink') +
        T(460, 294, 'depletion', 'ink', 'middle') +
        T(654, 294, 'n neutral · holes', 'ink') +
        T(376, 320, '−xp', 'ink', 'middle') +
        T(544, 320, 'xn', 'ink', 'middle'),
    ),
  },
  {
    n: 16,
    title: 'Electron, hole, and total current density across PN',
    lecture: 'L7–9',
    why: 'Away from the junction, recombination trades electron and hole current components. With negligible recombination inside depletion, each component is flat there. Total conventional current density is constant at every x in steady state.',
    eq: String.raw`J(x)=J_n(x)+J_p(x)=\mathrm{constant};\qquad J_p=-qD_p\,dp/dx`,
    drawing: fig(
      A(75, 35, 775, 234, 'position x →', 'current density J') +
        R(376, 38, 168, 231, '#f0f5f7') +
        L(376, 38, 376, 269, 'guide', true) +
        L(544, 38, 544, 269, 'guide', true) +
        P('M78 68 H848', 'green') +
        P('M78 236 C226 227 321 184 376 157 H544 C624 121 708 108 848 107', 'blue') +
        P('M78 107 C226 116 321 159 376 186 H544 C624 222 708 235 848 236', 'orange') +
        T(627, 61, 'Jtotal = constant', 'green') +
        T(647, 99, 'Jn', 'blue') +
        T(181, 100, 'Jp', 'orange') +
        T(463, 149, 'Jn flat', 'blue', 'middle') +
        T(463, 202, 'Jp flat', 'orange', 'middle') +
        T(190, 294, 'p side', 'ink') +
        T(460, 294, 'depletion', 'ink', 'middle') +
        T(692, 294, 'n side', 'ink') +
        T(376, 320, '−xp', 'ink', 'middle') +
        T(544, 320, 'xn', 'ink', 'middle'),
    ),
  },
  {
    n: 17,
    title: 'PN diode I–V including reverse breakdown',
    lecture: 'L7–8',
    why: 'Forward injection produces an exponential rise. Ordinary reverse bias gives nearly constant small leakage; sufficiently strong reverse bias enters breakdown. Breakdown may be avalanche or Zener, depending on doping and field.',
    eq: String.raw`I\simeq I_0(e^{V_A/V_T}-1),\qquad V_T=k_BT/q\simeq25.9\,\mathrm{mV}\ (300\,\mathrm K)`,
    drawing: fig(
      L(60, 190, 851, 190, 'axis', false, 2) +
        L(532, 31, 532, 273, 'axis', false, 2) +
        P(
          'M70 265 C85 230 98 198 144 198 C285 197 421 197 532 190 C620 190 657 176 698 126 C742 71 799 48 844 40',
          'blue',
        ) +
        L(145, 194, 145, 266, 'guide', true) +
        T(140, 292, '−VBR', 'orange', 'middle') +
        T(536, 292, '0', 'ink') +
        T(330, 214, 'reverse leakage ≈ −I0', 'ink') +
        T(671, 74, 'forward injection', 'blue') +
        T(766, 213, 'VA →', 'ink') +
        T(518, 44, 'I ↑', 'ink', 'end') +
        T(85, 235, 'breakdown', 'orange'),
    ),
  },
  {
    n: 18,
    title: 'Avalanche versus Zener reverse breakdown',
    lecture: 'L8',
    why: 'Avalanche breakdown uses energetic carriers accelerated through a relatively wide depleted region to create new electron–hole pairs. Zener breakdown uses tunneling across a narrow, strongly bent gap. Stronger doping makes depletion narrower and tends to favor tunneling.',
    eq: String.raw`|\mathcal E_{max}|\propto\sqrt{N_{light}(V_{bi}+V_R)}\quad\text{for a one-sided abrupt junction}`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Avalanche · impact ionization') +
        panel(470, 15, 430, 285, 'Zener · tunneling') +
        R(91, 55, 286, 196, '#f0f5f7') +
        R(663, 55, 74, 196, '#f0f5f7') +
        P('M70 104 C167 104 239 157 399 157', 'blue') +
        P('M70 192 C167 192 239 245 399 245', 'orange') +
        P('M525 86 C624 86 654 138 845 167', 'blue') +
        P('M525 176 C624 176 654 228 845 257', 'orange') +
        L(130, 210, 342, 139, 'green', true, 2.5) +
        L(651, 177, 745, 166, 'green', true, 2.5) +
        T(129, 286, 'wide W · collision → e⁻ + h⁺', 'ink') +
        T(557, 286, 'narrow W · interband tunnel', 'ink') +
        T(169, 79, 'moderate field over distance', 'blue') +
        T(569, 79, 'very strong field', 'blue'),
    ),
  },
  {
    n: 19,
    title: 'High-level injection near a one-sided PN junction',
    lecture: 'L8',
    why: 'As forward bias rises, injected minority density on the lightly doped side can rival or exceed its equilibrium majority density. The majority profile then develops a gradient, so its diffusion current is no longer negligible; the low-injection ideal-diode picture needs correction.',
    eq: String.raw`p^+n:\ \Delta p_n(x_n)\gtrsim n_{n0}\quad\text{marks high-level injection on n side}`,
    drawing: fig(
      A(82, 34, 765, 233, 'position x →', 'log concentration') +
        R(365, 38, 130, 229, '#f0f5f7') +
        P('M495 75 C583 110 680 168 845 199', 'orange') +
        P('M495 116 C580 145 670 170 845 177', 'blue') +
        P('M495 210 H845', 'gray', true, 2) +
        L(495, 177, 845, 177, 'guide', true) +
        T(532, 66, 'injected holes pn(x)', 'orange') +
        T(657, 164, 'majority electrons nn(x)', 'blue') +
        T(690, 221, 'equilibrium p n0', 'ink') +
        T(505, 291, 'xn · n-side edge', 'ink') +
        T(742, 291, 'n bulk', 'ink') +
        T(105, 86, 'p+ emitter', 'ink') +
        T(366, 120, 'depletion', 'ink'),
    ),
  },
  {
    n: 20,
    title: 'Stored minority charge: read area and edge slope',
    lecture: 'L9',
    why: 'The positive areas under both excess-carrier profiles count carriers. Multiplication by qA gives charge magnitude; the gradient at either depletion edge sets its injected diffusion current. A wider profile can store more charge even when its edge slope is similar.',
    eq: String.raw`Q_P=qA\Delta p_n(x_n)L_p,\quad |Q_N|=qA\Delta n_p(-x_p)L_n,\quad I_P=Q_P/\tau_p`,
    drawing: fig(
      A(78, 33, 768, 235, 'position x →', 'excess density') +
        R(384, 37, 152, 231, '#f0f5f7') +
        '<path d="M82 267 C213 262 337 222 384 72 L384 267 Z" fill="#2672d9" opacity="0.15"/>' +
        '<path d="M536 82 C584 207 700 260 844 267 L536 267 Z" fill="#df6037" opacity="0.15"/>' +
        P('M82 267 C213 262 337 222 384 72', 'blue') +
        P('M536 82 C584 207 700 260 844 267', 'orange') +
        T(191, 189, 'area × qA = |QN|', 'blue') +
        T(622, 188, 'area × qA = QP', 'orange') +
        T(290, 72, 'slope → In', 'blue') +
        T(574, 64, 'slope → Ip', 'orange') +
        T(384, 298, '−xp', 'ink', 'middle') +
        T(536, 298, 'xn', 'ink', 'middle') +
        T(253, 321, 'p neutral', 'ink') +
        T(656, 321, 'n neutral', 'ink'),
    ),
  },
  {
    n: 21,
    title: 'Depletion, diffusion, and total diode capacitance',
    lecture: 'L9',
    why: 'Reverse and weak forward bias are largely junction-capacitance territory. At appreciable forward current, minority stored charge grows rapidly and diffusion capacitance can dominate. At a given bias both incremental charge responses add.',
    eq: String.raw`C_J=\varepsilon_sA/W,\quad C_D\simeq\tau_{eff}I_D/V_T,\quad C_{total}=C_J+C_D`,
    drawing: fig(
      A(88, 34, 750, 238, 'VA → (forward positive)', 'capacitance C') +
        L(414, 37, 414, 270, 'guide', true) +
        P('M92 234 C276 222 429 188 822 148', 'blue') +
        P('M92 261 C438 260 568 255 654 227 C719 198 784 103 826 46', 'orange') +
        P('M92 232 C438 210 568 177 654 148 C719 121 784 67 826 28', 'green') +
        T(445, 292, '0', 'ink') +
        T(107, 292, 'reverse', 'ink') +
        T(708, 292, 'strong forward', 'ink') +
        T(612, 143, 'CJ · gradual', 'blue') +
        T(670, 214, 'CD · rapid', 'orange') +
        T(637, 60, 'Ctotal', 'green'),
    ),
  },
  {
    n: 22,
    title: 'Turn-off and reverse recovery waveforms',
    lecture: 'L9',
    why: 'A reverse current can flow immediately while the diode still contains forward-injected charge. During storage, Qp shrinks and voltage remains approximately forward-like. Around ts the stored injection collapses; current then approaches reverse leakage and voltage moves toward reverse bias.',
    eq: String.raw`Q_p(t)=\tau_p[(I_F+I_R)e^{-t/\tau_p}-I_R],\quad t_s\simeq\tau_p\ln(1+I_F/I_R)`,
    drawing: fig(
      [0, 1, 2]
        .map((k) => {
          const x = 18 + 302 * k;
          return (
            panel(
              x,
              16,
              286,
              284,
              ['Current i(t)', 'Stored holes Qp(t)', 'Junction voltage vA(t)'][k],
            ) +
            L(x + 31, 190, x + 263, 190, 'axis') +
            L(x + 70, 50, x + 70, 258, 'axis') +
            L(x + 170, 54, x + 170, 258, 'guide', true) +
            (k === 0
              ? P(
                  `M${x + 31} 105 H${x + 70} V${x + 70 + 1} 229 H${x + 170} C${x + 194} 201 ${x + 225} 190 ${x + 263} 190`,
                  'blue',
                ) +
                T(x + 37, 97, '+IF', 'blue') +
                T(x + 84, 247, '−IR', 'orange')
              : k === 1
                ? P(
                    `M${x + 70} 79 C${x + 111} 105 ${x + 143} 153 ${x + 170} 190 H${x + 263}`,
                    'orange',
                  ) + T(x + 81, 72, 'IF τp', 'orange')
                : P(
                    `M${x + 31} 105 H${x + 70} H${x + 123} C${x + 148} 106 ${x + 159} 150 ${x + 170} 190 C${x + 198} 221 ${x + 228} 237 ${x + 263} 237`,
                    'green',
                  )) +
            T(x + 169, 279, 'ts', 'purple', 'middle') +
            T(x + 257, 207, 't →', 'ink', 'end')
          );
        })
        .join(''),
    ),
  },
  {
    n: 23,
    title: 'Turn-on: current step, charge growth, voltage rise',
    lecture: 'L9',
    why: 'Constant applied forward current fills the neutral region. Recombination increases as charge accumulates, so Qp asymptotically approaches IFτp. Mapping charge to voltage needs the quasi-static profile approximation; the separate depletion charge also changes during real switching.',
    eq: String.raw`Q_p(t)=I_F\tau_p(1-e^{-t/\tau_p}),\quad v_A\simeq V_T\ln[1+Q_p/(\tau_pI_0)]`,
    drawing: fig(
      [0, 1, 2]
        .map((k) => {
          const x = 18 + 302 * k;
          return (
            panel(x, 16, 286, 284, ['Applied current', 'Stored charge', 'Diode voltage'][k]) +
            L(x + 30, 250, x + 263, 250, 'axis') +
            L(x + 70, 58, x + 70, 250, 'axis') +
            (k === 0
              ? P(`M${x + 30} 250 H${x + 70} V${x + 70} 95 H${x + 260}`, 'blue') +
                T(x + 94, 86, 'IF', 'blue')
              : k === 1
                ? P(`M${x + 70} 250 C${x + 105} 163 ${x + 145} 113 ${x + 260} 100`, 'orange') +
                  L(x + 70, 98, x + 263, 98, 'orange', true) +
                  T(x + 141, 82, 'IF τp', 'orange')
                : P(`M${x + 70} 250 C${x + 94} 159 ${x + 135} 114 ${x + 260} 104`, 'green') +
                  T(x + 152, 90, 'VF,steady', 'green')) +
            T(x + 257, 277, 't →', 'ink', 'end')
          );
        })
        .join(''),
    ),
  },
  {
    n: 24,
    title: 'Forward diode as a temperature sensor',
    lecture: 'L10',
    why: 'At fixed forward current, silicon diode forward voltage generally falls with increasing temperature because saturation current rises strongly. The exact slope depends on current, device, and calibration; it is not one universal number.',
    eq: String.raw`V_F=\eta V_T\ln[1+I/I_S(T)],\qquad S_T=\left.\frac{dV_F}{dT}\right|_I<0\ \text{typically}`,
    drawing: fig(
      A(105, 38, 735, 231, 'Temperature T →', 'forward voltage VF') +
        P('M119 72 C358 115 584 173 827 229', 'blue') +
        dot(427, 147) +
        T(439, 140, 'calibration point (T0, VF0)', 'blue') +
        T(568, 198, 'slope ST = dVF/dT|I', 'orange') +
        T(111, 297, 'fixed forward current I', 'ink') +
        T(664, 74, 'device-dependent', 'ink'),
    ),
  },
  {
    n: 25,
    title: 'Varactor: reverse bias tunes capacitance and frequency',
    lecture: 'L10',
    why: 'Increasing reverse bias widens the depletion region, reducing junction capacitance. In an LC resonator with fixed L, the smaller capacitance raises resonant frequency. Both curves are nonlinear.',
    eq: String.raw`C_J(V_R)=C_0(1+V_R/V_{bi})^{-m},\quad f_0=1/(2\pi\sqrt{LC_J})`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Junction capacitance') +
        panel(470, 15, 430, 285, 'Resonance with fixed L') +
        A(74, 63, 324, 195, 'VR →', 'CJ') +
        A(526, 63, 323, 195, 'VR →', 'f0') +
        P('M78 93 C188 153 304 194 396 211', 'blue') +
        P('M530 227 C637 190 742 133 847 84', 'green') +
        T(83, 87, 'C0', 'blue') +
        T(535, 219, 'f0(0)', 'green') +
        T(120, 288, 'reverse bias ↑ · W ↑', 'ink') +
        T(590, 288, 'CJ ↓ means f0 ↑', 'ink'),
    ),
  },
  {
    n: 26,
    title: 'Solar cell: dark and illuminated I–V; output power',
    lecture: 'L10',
    why: 'Illumination shifts the diode current downward by photocurrent. The current at V = 0 gives short-circuit magnitude ISC; the voltage where I = 0 is VOC. The maximum output power lies between those endpoints, not at either one.',
    eq: String.raw`I=I_0(e^{V/V_T}-1)-I_{ph},\quad V_{OC}=V_T\ln(1+I_{ph}/I_0),\quad P_{out}=-VI`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Dark and illuminated I–V') +
        panel(470, 15, 430, 285, 'Electrical output power') +
        L(73, 155, 402, 155, 'axis') +
        L(135, 55, 135, 257, 'axis') +
        P('M70 157 C204 155 274 149 346 63', 'gray') +
        P('M70 231 C185 230 289 221 352 155 C373 121 389 89 402 58', 'blue') +
        T(141, 246, '−ISC', 'blue') +
        T(353, 178, 'VOC', 'green') +
        T(266, 228, 'power-generating quadrant', 'ink') +
        A(526, 56, 323, 199, 'V →', 'Pout') +
        P('M529 255 C600 182 664 114 713 113 C773 115 813 177 847 255', 'orange') +
        dot(713, 113, '#d66732') +
        T(725, 103, 'Pmax at VMP', 'orange') +
        T(542, 283, '0', 'ink') +
        T(823, 283, 'VOC', 'ink'),
    ),
  },
  {
    n: 27,
    title: 'Solar-cell collection and LED emission structures',
    lecture: 'L10',
    why: 'A solar cell absorbs photons to generate electron–hole pairs, then its junction field separates and collects them. An LED runs forward: injected electrons and holes recombine radiatively, and photon energy is set roughly by band gap. Direct gaps favor light emission.',
    eq: String.raw`E_\gamma\simeq E_g=hc/\lambda;\qquad \lambda(\mu\mathrm m)\simeq1.24/E_g(\mathrm{eV})`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Solar cell · light → electrical output') +
        panel(470, 15, 430, 285, 'LED · electrical input → light') +
        R(85, 72, 107, 159, '#f2dce0') +
        R(192, 72, 161, 159, '#dcecf6') +
        R(537, 72, 119, 159, '#f2dce0') +
        R(656, 72, 166, 159, '#dcecf6') +
        L(192, 72, 192, 231, 'purple', true, 2) +
        L(656, 72, 656, 231, 'purple', true, 2) +
        T(99, 108, 'p side', 'ink') +
        T(240, 108, 'n side', 'ink') +
        T(552, 108, 'p side', 'ink') +
        T(724, 108, 'n side', 'ink') +
        P('M110 46 L154 103', 'orange') +
        P('M194 153 L113 153', 'blue') +
        P('M199 174 L320 174', 'orange') +
        P('M553 147 L661 147', 'orange') +
        P('M793 181 L663 181', 'blue') +
        P('M680 125 L751 56', 'green') +
        T(97, 263, 'absorb hν; collect e⁻ and h⁺', 'ink') +
        T(567, 263, 'inject e⁻ + h⁺; emit hν', 'ink') +
        T(652, 51, 'photon', 'green'),
    ),
  },
);

figures.push(
  {
    n: 28,
    title: 'P-type MOS bands: four operating regions',
    lecture: 'L11–13',
    why: 'A negative gate attracts holes and bends Si bands upward at the surface; a positive gate first depletes holes, then forms an electron inversion layer. EF is flat within equilibrium Si; applied gate bias separates metal and Si Fermi levels. With no oxide space charge, oxide edges and vacuum level have a linear slope.',
    eq: String.raw`V_G=V_{FB}+V_{ox}+\psi_s,\quad E_C(0)-E_C(\infty)=-q\psi_s,\quad \psi_{s,T}\simeq2\phi_F`,
    drawing: mosBands('p'),
  },
  {
    n: 29,
    title: 'N-type MOS bands: reversed gate polarity',
    lecture: 'L11–13',
    why: 'Positive gate accumulates electrons and bends Si bands downward. Negative gate depletes electrons and eventually creates a hole inversion layer; the band-bending polarity reverses from p-type. Keep the oxide energy slope linear and distinguish EF,M from EF,Si under applied bias.',
    eq: String.raw`\phi_F=V_T\ln(N_D/n_i)>0,\qquad \psi_{s,T}\simeq-2\phi_F\ \text{for n-type Si}`,
    drawing: mosBands('n'),
  },
  {
    n: 30,
    title: 'MOS spatial charge density in three regimes',
    lecture: 'L11–12',
    why: 'For p-type Si: accumulation piles mobile positive holes at the interface; depletion exposes negative fixed acceptor ions over width W; inversion adds a thin negative electron sheet on top of the ionized-acceptor region. Gate charge has the opposite sign from total Si charge.',
    eq: String.raw`Q_S=Q_{acc}+Q_{dep}+Q_{inv},\quad Q_G=-Q_S\ \text{for an ideal MOS stack}`,
    drawing: fig(
      [0, 1, 2]
        .map((k) => {
          const x = 18 + 302 * k;
          return (
            panel(x, 16, 286, 284, ['Accumulation', 'Depletion', 'Inversion'][k]) +
            L(x + 55, 166, x + 260, 166, 'axis') +
            L(x + 107, 62, x + 107, 259, 'guide', true) +
            R(x + 21, 58, 86, 196, '#fff0d8') +
            R(x + 107, 58, 152, 196, '#f4f9f7') +
            (k === 0
              ? R(x + 112, 77, 13, 89, '#f3b8aa') + T(x + 136, 91, '+ holes', 'orange')
              : R(x + 112, 166, k === 1 ? 89 : 111, 66, '#d8e8f7') +
                T(x + 137, 218, '−qNA', 'blue') +
                (k === 2
                  ? R(x + 112, 165, 13, 77, '#c7b3e8') + T(x + 131, 113, '− electrons', 'purple')
                  : '')) +
            T(x + 28, 85, k === 0 ? '−QG' : '+QG', 'green') +
            T(x + 112, 279, 'Si interface', 'ink') +
            T(x + 232, 279, 'x →', 'ink')
          );
        })
        .join(''),
    ),
  },
  {
    n: 31,
    title: 'P-type MOS surface-charge components versus gate voltage',
    lecture: 'L12',
    why: 'To the left of VFB, mobile hole accumulation is positive. Between VFB and VT, negative depletion charge grows then approaches its maximum. Beyond VT, inversion electrons add rapidly increasing negative charge while depletion charge changes little.',
    eq: String.raw`Q_{dep}\simeq-qN_AW,\quad Q_{inv}\simeq-C_{ox}'(V_G-V_T)\ \text{above threshold}`,
    drawing: fig(
      A(90, 33, 748, 242, 'VG →', 'Si surface charge QS') +
        L(90, 149, 838, 149, 'axis') +
        L(343, 37, 343, 275, 'guide', true) +
        L(598, 37, 598, 275, 'guide', true) +
        P('M97 57 C183 81 280 125 343 149', 'orange') +
        P('M343 149 C444 186 522 208 598 211 H836', 'blue') +
        P('M598 149 C695 168 765 196 836 226', 'purple') +
        P('M598 211 C681 227 754 253 836 273', 'green') +
        T(134, 52, 'Qacc > 0 · holes', 'orange') +
        T(444, 224, 'Qdep → −qNAWT', 'blue') +
        T(657, 176, 'Qinv · electrons', 'purple') +
        T(716, 269, 'QS total', 'green') +
        T(343, 301, 'VFB', 'ink', 'middle') +
        T(598, 301, 'VT', 'ink', 'middle') +
        T(175, 321, 'accumulation', 'ink') +
        T(435, 321, 'depletion', 'ink') +
        T(696, 321, 'inversion', 'ink'),
    ),
  },
  {
    n: 32,
    title: 'MOS surface potential and depletion width versus gate voltage',
    lecture: 'L12',
    why: 'For p-type Si, φs and W start growing after flat band. In strong inversion, surface potential approaches 2φF and depletion width approaches WT; further positive gate bias mostly adds inversion charge. These are useful idealized plateaus, not abrupt discontinuities.',
    eq: String.raw`W=\sqrt{2\varepsilon_s\psi_s/(qN_A)},\quad W_T=\sqrt{4\varepsilon_s\phi_F/(qN_A)}`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Surface potential') +
        panel(470, 15, 430, 285, 'Depletion width') +
        A(72, 60, 328, 193, 'VG →', 'ψs') +
        A(521, 60, 328, 193, 'VG →', 'W') +
        P('M75 250 H170 C214 247 259 115 333 98 H398', 'blue') +
        P('M523 250 H622 C664 247 711 125 784 101 H847', 'orange') +
        L(170, 59, 170, 253, 'guide', true) +
        L(333, 59, 333, 253, 'guide', true) +
        L(622, 59, 622, 253, 'guide', true) +
        L(784, 59, 784, 253, 'guide', true) +
        T(329, 89, '2φF', 'blue') +
        T(784, 90, 'WT', 'orange') +
        T(169, 280, 'VFB', 'ink', 'middle') +
        T(331, 280, 'VT', 'ink', 'middle') +
        T(621, 280, 'VFB', 'ink', 'middle') +
        T(781, 280, 'VT', 'ink', 'middle'),
    ),
  },
  {
    n: 33,
    title: 'P-type MOS C–V: LF, HF, and deep depletion',
    lecture: 'L12–13',
    why: 'Accumulation sits near Cox. Depletion widens so the series combination falls toward Cmin. In slow inversion, minority electrons follow the AC signal and C returns toward Cox. In high-frequency inversion they cannot follow, leaving C near Cmin. A rapid DC sweep can temporarily deepen depletion and fall below Cmin.',
    eq: String.raw`C_{ox}'=\varepsilon_{ox}/t_{ox},\quad C_{min}'=\left(1/C_{ox}'+W_T/\varepsilon_s\right)^{-1}`,
    drawing: fig(
      A(96, 39, 739, 229, 'VG →', 'C / Cox') +
        R(98, 43, 221, 224, '#edf5fb') +
        R(319, 43, 224, 224, '#fff4e3') +
        R(543, 43, 291, 224, '#edf7ee') +
        L(96, 72, 835, 72, 'guide', true) +
        L(319, 43, 319, 269, 'guide', true) +
        L(543, 43, 543, 269, 'guide', true) +
        P('M99 75 H280 C341 75 414 199 543 214 C634 213 685 78 832 75', 'green') +
        P('M99 75 H280 C341 75 414 199 543 214 H833', 'blue') +
        P('M543 214 C647 235 736 250 832 257', 'orange', true) +
        T(102, 65, 'Cox', 'ink') +
        T(551, 208, 'Cmin', 'ink') +
        T(294, 110, 'CFB', 'ink') +
        T(725, 92, 'LF / quasi-static', 'green') +
        T(720, 204, 'HF', 'blue') +
        T(683, 251, 'deep depletion', 'orange') +
        T(208, 294, 'accumulation', 'ink', 'middle') +
        T(431, 294, 'depletion', 'ink', 'middle') +
        T(690, 294, 'inversion', 'ink', 'middle') +
        T(319, 320, 'VFB', 'ink', 'middle') +
        T(543, 320, 'VT', 'ink', 'middle'),
    ),
  },
  {
    n: 34,
    title: 'N-type MOS C–V: invert the voltage direction',
    lecture: 'L11–13',
    why: 'For n-type Si, negative gate voltage creates hole inversion, the middle range is depletion, and positive gate voltage accumulates electrons. The low- and high-frequency distinction remains on the inversion side, now at negative VG.',
    eq: String.raw`C'^{-1}\simeq C_{ox}'^{-1}+C_{dep}'^{-1}\ \text{when depletion charge is the AC response}`,
    drawing: fig(
      A(96, 38, 739, 231, 'VG →', 'C / Cox') +
        R(98, 43, 291, 224, '#edf7ee') +
        R(389, 43, 225, 224, '#fff4e3') +
        R(614, 43, 220, 224, '#edf5fb') +
        L(389, 43, 389, 269, 'guide', true) +
        L(614, 43, 614, 269, 'guide', true) +
        P('M99 75 C235 75 287 211 389 214 C515 202 566 75 615 75 H833', 'green') +
        P('M99 214 H389 C515 202 566 75 615 75 H833', 'blue') +
        T(120, 90, 'LF: holes follow', 'green') +
        T(123, 206, 'HF: Cmin', 'blue') +
        T(730, 68, 'Cox', 'ink') +
        T(215, 296, 'hole inversion', 'ink', 'middle') +
        T(500, 296, 'depletion', 'ink', 'middle') +
        T(729, 296, 'electron accumulation', 'ink', 'middle') +
        T(389, 320, 'VT,n-type', 'ink', 'middle') +
        T(614, 320, 'VFB', 'ink', 'middle'),
    ),
  },
  {
    n: 35,
    title: 'MOS nonideal charge: C–V shift, stretch, and VFB versus tox',
    lecture: 'L13',
    why: 'Positive fixed oxide charge shifts a p-type MOS C–V curve toward more negative VG without changing its ideal shape. Interface traps can stretch the transition because occupancy changes with bias. Across oxide thicknesses, the VFB intercept reveals work-function difference and the slope reveals fixed charge.',
    eq: String.raw`V_{FB}=\phi_{MS}-Q_F/C_{ox}'=\phi_{MS}-Q_Ft_{ox}/\varepsilon_{ox}`,
    drawing: fig(
      panel(20, 15, 430, 285, 'C–V: ideal, shifted, stretched') +
        panel(470, 15, 430, 285, 'Flat band versus oxide thickness') +
        A(75, 60, 322, 194, 'VG →', 'C') +
        A(525, 60, 322, 194, 'tox →', 'VFB') +
        P('M78 82 H194 C252 82 273 220 319 221 H396', 'gray') +
        P('M78 82 H156 C214 82 235 220 281 221 H396', 'orange') +
        P('M78 82 H156 C218 82 259 205 319 221 H396', 'purple', true) +
        L(156, 67, 156, 257, 'guide', true) +
        L(194, 67, 194, 257, 'guide', true) +
        T(101, 283, 'positive QF shifts VFB left', 'orange') +
        T(279, 101, 'traps stretch', 'purple') +
        P('M528 89 L846 220', 'blue') +
        T(533, 85, 'φMS at tox = 0', 'blue') +
        T(618, 178, 'slope = −QF/εox', 'green'),
    ),
  },
  {
    n: 36,
    title: 'Poly depletion, inversion depth, and effective oxide thickness',
    lecture: 'L13',
    why: 'A doped poly gate can deplete under bias, spending some applied voltage inside the gate. The inversion charge centroid also sits inside Si rather than exactly at the interface. These extra electrical separations lower effective gate capacitance even if the physical oxide does not change.',
    eq: String.raw`t_{oxe}\simeq t_{ox}+(W_{poly}+T_{inv})/3,\qquad C_{oxe}'\simeq\varepsilon_{ox}/t_{oxe}`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Gate-stack cross section') +
        panel(470, 15, 430, 285, 'Effective capacitance') +
        R(62, 70, 110, 147, '#d8e7f5') +
        R(172, 70, 90, 147, '#fff0d8') +
        R(262, 70, 147, 147, '#e6f5eb') +
        R(145, 70, 27, 147, '#afcbe7') +
        R(262, 70, 29, 147, '#b4dfca') +
        T(60, 57, 'n+ poly', 'ink') +
        T(193, 57, 'oxide', 'ink') +
        T(302, 57, 'Si inversion', 'ink') +
        T(97, 155, 'Wpoly', 'blue') +
        T(194, 155, 'tox', 'orange') +
        T(302, 155, 'Tinv', 'green') +
        T(61, 263, 'extra separation → lower C', 'ink') +
        A(525, 61, 320, 195, 'oxide field →', 'Coxe / Cox') +
        P('M529 86 C617 103 703 151 843 203', 'blue') +
        P('M529 76 C633 80 737 102 843 126', 'orange', true) +
        T(642, 212, 'lightly doped poly', 'blue') +
        T(655, 115, 'heavily doped poly', 'orange'),
    ),
  },
  {
    n: 37,
    title: 'NMOS channel: low VDS, pinch-off, and beyond',
    lecture: 'L14',
    why: 'Inversion charge is largest near the source and decreases toward the drain as channel potential rises. At VDS ≈ VGS − VT, charge at the drain end reaches zero: pinch-off. Higher VDS extends the drain-side depleted region, but electrons are swept through it; current does not stop.',
    eq: String.raw`Q'_{inv}(x)\simeq-C_{oxe}'[V_{GS}-V_T-V(x)],\quad V_{DS,sat}\simeq V_{GS}-V_T`,
    drawing: fig(
      [0, 1, 2]
        .map((k) => {
          const x = 18 + 302 * k;
          const end = [237, 206, 178][k];
          return (
            panel(x, 16, 286, 284, ['Small VDS · triode', 'VDS = VDS,sat', 'VDS > VDS,sat'][k]) +
            R(x + 35, 67, 214, 57, '#d8e7f5') +
            R(x + 35, 124, 214, 26, '#fff0d8') +
            R(x + 35, 150, 214, 104, '#e6f5eb') +
            R(x + 35, 150, 35, 68, '#c5d5e8') +
            R(x + 214, 150, 35, 68, '#c5d5e8') +
            P(
              `M${x + 70} 154 L${x + end} ${k === 0 ? 163 : 151}`,
              'blue',
              false,
              k === 0 ? 10 : 7,
            ) +
            (k > 0 ? R(x + end, 150, 214 - end, 63, '#f6ded7') : '') +
            T(x + 93, 101, 'gate', 'ink') +
            T(x + 93, 141, 'oxide', 'ink') +
            T(x + 42, 236, 'n+ source', 'ink') +
            T(x + 184, 236, 'n+ drain', 'ink') +
            T(
              x + 84,
              276,
              k === 0
                ? 'continuous channel'
                : k === 1
                  ? 'drain-end charge → 0'
                  : 'effective L shortens',
              'blue',
            )
          );
        })
        .join(''),
    ),
  },
  {
    n: 38,
    title: 'NMOS output family and transfer curve',
    lecture: 'L14',
    why: 'Each ID–VDS trace rises approximately linearly at low VDS then bends into saturation at its own VDS,sat. More VGS means larger channel charge and current. Channel-length modulation gives saturation a small positive slope. The ID–VGS transfer plot turns on near VT and grows roughly quadratically in ideal long-channel saturation.',
    eq: String.raw`I_{D,sat}\simeq\tfrac12\mu C_{oxe}'(W/L)(V_{GS}-V_T)^2[1+\lambda(V_{DS}-V_{DS,sat})]`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Output: ID versus VDS') +
        panel(470, 15, 430, 285, 'Transfer: ID versus VGS') +
        A(74, 56, 324, 200, 'VDS →', 'ID') +
        A(525, 56, 322, 200, 'VGS →', 'ID') +
        P('M76 255 C133 215 170 208 200 207 C270 203 326 198 398 188', 'blue') +
        P('M76 255 C144 174 209 157 253 155 C305 150 349 145 398 136', 'orange') +
        P('M76 255 C151 125 236 101 291 100 C335 96 367 91 398 86', 'purple') +
        L(210, 102, 210, 256, 'guide', true) +
        T(178, 282, 'VDS,sat ≈ VGS − VT', 'ink') +
        T(273, 115, 'larger VGS', 'purple') +
        T(286, 224, 'CLM: slight slope', 'green') +
        P('M529 256 H630 C682 249 735 192 845 77', 'green') +
        L(630, 63, 630, 257, 'guide', true) +
        T(630, 284, 'VT', 'ink', 'middle') +
        T(696, 106, 'ideal saturation ≈ square law', 'green'),
    ),
  },
  {
    n: 39,
    title: 'NMOS body effect: threshold versus source–body bias',
    lecture: 'L14',
    why: 'Reverse biasing the p-type body relative to source widens depletion under the channel. The gate must then balance more negative ionized-acceptor charge before inversion, so NMOS threshold rises. Distinguish this threshold shift from channel-length modulation, which changes output slope.',
    eq: String.raw`V_T(V_{SB})=V_{T0}+\gamma[\sqrt{2\phi_F+V_{SB}}-\sqrt{2\phi_F}]`,
    drawing: fig(
      panel(20, 15, 430, 285, 'Threshold shift') +
        panel(470, 15, 430, 285, 'Depletion-charge picture') +
        A(75, 58, 324, 197, 'VSB ≥ 0 →', 'VT') +
        P('M79 220 C188 170 281 139 396 115', 'blue') +
        T(84, 211, 'VT0', 'blue') +
        T(238, 105, 'body reverse bias ↑', 'ink') +
        R(528, 66, 285, 54, '#d8e7f5') +
        R(528, 120, 285, 27, '#fff0d8') +
        R(528, 147, 285, 106, '#e6f5eb') +
        R(528, 147, 285, 81, '#f6ded7') +
        T(548, 100, 'gate', 'ink') +
        T(548, 141, 'oxide', 'ink') +
        T(549, 183, 'more exposed − acceptor charge', 'orange') +
        T(549, 211, 'wider body depletion', 'orange') +
        T(548, 284, 'VSB ↑ → |Qdep| ↑ → VT ↑', 'green'),
    ),
  },
);
