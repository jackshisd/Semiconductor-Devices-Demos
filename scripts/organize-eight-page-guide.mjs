import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

// Reflow existing equations in lecture order before assigning page-based codes.
// Source equation identifiers remain attached until all references are remapped.
export function organizeEightPageGuide(markups, documentStart, chrome, temp) {
  const groups = new Map();
  function children(html) {
    const out = [];
    let depth = 0,
      start = -1;
    for (const match of html.matchAll(/<\/?div\b[^>]*>/g)) {
      const closing = match[0].startsWith('</');
      if (!closing && depth++ === 0) start = match.index;
      if (closing && --depth === 0) out.push(html.slice(start, match.index + match[0].length));
    }
    if (depth !== 0) throw Error('Unbalanced sheet blocks');
    return out;
  }
  for (const markup of markups) {
    const prefix = '<div class="columns"><div class="column">',
      separator = '</div><div class="column">';
    const start = markup.indexOf(prefix) + prefix.length,
      middle = markup.indexOf(separator, start),
      end = markup.indexOf('</div></div><footer>', middle);
    for (const col of [markup.slice(start, middle), markup.slice(middle + separator.length, end)]) {
      let group;
      for (const html of children(col)) {
        const title = html.match(/class="topic"><strong>([^<]+)<\/strong>/)?.[1];
        if (title) {
          if (groups.has(title)) throw Error('Duplicate topic ' + title);
          group = { title, heading: html, items: [] };
          groups.set(title, group);
        } else if (
          group &&
          !/class="(?:concept-graph|band-diagrams|mini-band-diagrams|mos-cv-graphs|mini-graphs)\b/.test(
            html,
          )
        )
          group.items.push(html);
      }
    }
  }
  const get = (title) => {
    const g = groups.get(title);
    if (!g) throw Error('Missing chronological topic ' + title);
    return g;
  };
  const equation = (title, code) => get(title).items.find((x) => x.includes(`>(${code})</span>`));
  const heading = (title, ref, category = 'mos') =>
    `<div data-category="${category}" class="topic"><strong>${title}</strong><span>${ref}</span></div>`;
  const custom = (title, ref, items, category = 'mos') => ({
    title,
    heading: heading(title, ref, category),
    items: items.filter(Boolean),
  });
  const note = (text) => `<div class="note">${text}</div>`;
  const work = get('HW4 P3: N-type MOS and band bending');
  const workFunctions = custom(
    'MOS work functions and flat band',
    'Lecture 11 · HW4 P3; HW5 P1–4',
    work.items.filter((x) => !x.includes('>(22j)</span>') && !x.includes('>(22k)</span>')),
  );
  const thresholds = custom(
    'Threshold: explicit p-type and n-type formulas',
    'Lecture 12 · HW5 P1–3',
    [
      equation(work.title, '22j'),
      equation(work.title, '22k'),
      ...get('23. Strong inversion and threshold').items,
    ],
  );
  const schottkyCV = custom(
    'Schottky barrier from C–V',
    'Lectures 5–6 · HW2 P4; HW3 P3',
    [
      equation('7. Depletion capacitance and C–V', '7f'),
      ...get('Schottky contact: interpret the C–V line').items,
    ],
    'junctions',
  );
  // Locate the Schottky equation by its explicit purpose if its historical tag differs.
  const cap = get('7. Depletion capacitance and C–V');
  const barrier = cap.items.find((x) => x.includes('Schottky barrier from C–V'));
  if (!barrier) throw Error('Missing Schottky barrier equation');
  schottkyCV.items = [barrier, ...get('Schottky contact: interpret the C–V line').items];
  const pnCap = {
    ...cap,
    items: cap.items.filter((x) => x !== barrier && !x.includes('C–V signs use')),
  };
  const charge = custom(
    'Total silicon charge in accumulation, depletion and inversion',
    'Lecture 12 · HW5 P2',
    [
      equation('26. HW5: total MOS charge and implant dose', '26a'),
      note(
        'Charge diagrams: p substrate has ρ = −qNA in depletion; n substrate has ρ = +qND. Inversion charge is concentrated near the surface. Gate charge balances total silicon charge: QG′ = −Qs′.',
      ),
    ],
  );
  const implant = custom('Threshold adjustment by ion implantation', 'Lecture 13 · HW5 P3e', [
    equation('26. HW5: total MOS charge and implant dose', '26b'),
    note(
      'Shallow, fully ionized implant in depletion; first-order sheet-charge approximation. Choose a signed target threshold first. Acceptors raise signed threshold; donors lower it.',
    ),
  ]);
  const trends = get('HW5: geometry, trends and graph clues');
  const cvChecks = custom(
    'C–V interpretation and dimensional checks',
    'Lectures 12–13 · HW5 P1, P3–4',
    trends.items,
  );
  const slideGroups = [12, 13].map((n) =>
    custom(
      `Lecture 11 slide ${n}: ${n === 12 ? 'p-type' : 'n-type'} MOS operating regions`,
      'Original lecture slide; reduced to fit the eight-page reference',
      [
        `<div class="requested-slide"><img src="data:image/png;base64,${readFileSync(resolve('public/guides/lecture11-slide-' + n + '.png')).toString('base64')}" alt="Lecture 11 slide ${n}"/>${n === 12 ? '<div class="xref">Slide 12 assumes ΦM = ΦS, so VFB = 0 in that example.</div>' : ''}</div>`,
      ],
    ),
  );
  const first = [
    ['Reference values at 300 K', 1],
    ['Units and polarity reminders', 1],
    ['1. Occupation and carrier statistics', 2],
    ['Density of states and thermal carriers', 2],
    ['HW1: compare intrinsic concentrations', 2],
    ['2. Doping and charge neutrality', 2],
    ['Fermi-level location', 3],
    ['3. Drift, mobility and resistivity', 3],
    ['Drift and diffusion current', 4],
    ['4. Continuity and generation', 4],
    ['Continuity: useful limiting cases', 4],
    ['Minority diffusion and illuminated bar', 4],
    ['5. Quasi-Fermi levels', 5],
    ['Electrostatic potential and Poisson equation', 5],
    ['8. Metal–semiconductor contacts', 5],
    [schottkyCV, 5],
    ['6. Abrupt PN junction: voltage and width', 6],
    ['One degenerately doped PN side', 6],
    ['Abrupt PN junction: field and charge', 6],
    ['HW3: check built-in voltage', 6],
    [pnCap, 6],
    ['PN junction capacitance: bias forms', 6],
    ['15. C–V extraction: junctions and MOS', 6],
    ['9. Ideal PN diode', 7],
    ['11. Biased PN minority carriers', 7],
    ['HW3: minority current components', 7],
    ['10. Nonideal current and breakdown', 8],
    ['12. Stored excess charge', 9],
    ['14. Small-signal diode around DC bias', 9],
    ['Quick selection by operating regime', 9],
    ['13. Charge control: current → stored charge', 9],
    ['Stored charge → diode voltage', 9],
    ['16. PN junction as temperature sensor', 10],
    ['17. Varactor: reverse-bias tuning', 10],
    ['18. Photodiode collection', 10],
    ['HW4 P2: minority-hole continuity', 10],
    ['19. Solar-cell I–V and open circuit', 10],
    ['20. LED emission', 10],
    ['21. MOS stack and flat band', 11],
    [workFunctions, 11],
    ['27. HW5: work-function and C–V checks', 11],
    [slideGroups[0], 11],
    [slideGroups[1], 11],
  ];
  const last = [
    ['22. Both MOS substrate polarities', 12],
    ['Depletion versus gate voltage', 12],
    [thresholds, 12],
    [charge, 12],
    ['24. MOS capacitance versus frequency', 12],
    ['MOS C–V: read the measured curve', 13],
    [cvChecks, 13],
    [implant, 13],
    ['Polysilicon gate depletion', 13],
    ['25. NMOS and PMOS current', 14],
  ];
  const units = [];
  function flatten(sequence) {
    return sequence.flatMap(([name, lecture]) => {
      const g = typeof name === 'string' ? get(name) : name;
      const title = g.title
        .replace(/^\d+\.\s*/, '')
        .replace('15. ', '')
        .replace('Both MOS substrate polarities', 'MOS accumulation and depletion');
      const h = g.heading.replace(/<strong>[^<]+<\/strong>/, `<strong>${title}</strong>`);
      // Keep the title with its first item, and each remaining equation intact.
      if (!g.items.length) return [];
      const items = g.items.filter(
        (item) =>
          !item.startsWith('<div class="note">') ||
          /Both substrate types:|Read the substrate label|<b>NMOS:|Shallow,|Thin, ionized|Si donors/.test(
            item,
          ),
      );
      return items.map((item, i) => {
        const unit = {
          id: units.length,
          lecture,
          title,
          html: (i === 0 ? h : '') + item,
          heading: h,
          first: i === 0,
        };
        units.push(unit);
        return unit;
      });
    });
  }
  const early = flatten(first),
    late = flatten(last);
  const extraCss = `<style>.flow-unit{display:flow-root}.chronological .formula{margin:2px 0 3px}.chronological .formula .math{font-size:9.2pt;line-height:1.15}.chronological .formula.compact .math{font-size:8.5pt;line-height:1.15}.chronological .formula .purpose{font-size:7pt;line-height:1.1}.chronological .topic{margin:3px 0 2px;padding-bottom:2px}.chronological .topic strong{font-size:9.5pt}.chronological .topic span{font-size:6.5pt;margin-top:2px}.chronological .note{font-size:7pt;line-height:1.1;padding:3px 5px;margin:3px 0}.chronological .xref{font-size:7pt;margin:2px 0}.requested-slide img{display:block;width:100%;height:auto}.chronological .route{font-size:6.8pt!important}</style>`;
  function unitHtml(u) {
    return `<div class="flow-unit ${u.html.includes('data-category="mos"') ? 'mos' : ''}" data-unit="${u.id}">${u.html}</div>`;
  }
  const probe = resolve(temp, 'chronology-measure.html');
  const probeHtml =
    documentStart.replace('</head>', extraCss + '</head>') +
    `<section class="page eight chronological"><div class="columns"><div class="column">${units.map(unitHtml).join('')}</div><div></div></div></section><script>addEventListener('load',async()=>{await document.fonts.ready;const p=document.createElement('pre');p.id='measure-data';p.textContent=JSON.stringify([...document.querySelectorAll('[data-unit]')].map(e=>({id:+e.dataset.unit,height:e.getBoundingClientRect().height})));document.body.append(p);});</script></body></html>`;
  writeFileSync(probe, probeHtml);
  const measured = spawnSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--allow-file-access-from-files',
      '--virtual-time-budget=2000',
      '--user-data-dir=' + resolve(temp, 'chrome-chronology-measure'),
      '--dump-dom',
      pathToFileURL(probe).href,
    ],
    { encoding: 'utf8', timeout: 60000, maxBuffer: 30 * 1024 * 1024 },
  );
  if (measured.status !== 0) throw Error('Chronology measurement failed: ' + measured.stderr);
  const json = measured.stdout.match(/<pre id="measure-data">([\s\S]*?)<\/pre>/)?.[1];
  if (!json) throw Error('Missing browser layout measurements');
  const heights = new Map(JSON.parse(json).map((x) => [x.id, x.height]));
  writeFileSync(
    resolve(temp, 'chronology-measurements.json'),
    JSON.stringify(
      {
        early: early.reduce((s, u) => s + heights.get(u.id), 0),
        late: late.reduce((s, u) => s + heights.get(u.id), 0),
        units: units.map((u) => ({ title: u.title, height: heights.get(u.id) })),
      },
      null,
      2,
    ),
  );
  function pack(sequence, count) {
    const sum = sequence.reduce((n, u) => n + heights.get(u.id), 0);
    for (let max = Math.ceil(sum / count) + 10; max <= 900; max += 2) {
      const cols = [];
      let col = [],
        used = 0;
      for (const u of sequence) {
        const h = heights.get(u.id);
        if (col.length && used + h > max) {
          cols.push(col);
          col = [];
          used = 0;
        }
        col.push(u);
        used += h;
      }
      if (col.length) cols.push(col);
      if (cols.length <= count) {
        while (cols.length < count) cols.push([]);
        return { cols, max, sum };
      }
    }
    throw Error(`Chronological content needs more room: ${sum}px for ${count} columns`);
  }
  const a = pack([...early, ...late], 16);
  writeFileSync(
    resolve(temp, 'chronology-layout.json'),
    JSON.stringify(
      {
        flow: { sum: a.sum, max: a.max },
        topics: units.map((u) => ({
          id: u.id,
          title: u.title,
          lecture: u.lecture,
          height: heights.get(u.id),
        })),
      },
      null,
      2,
    ),
  );
  const pages = [];
  for (let i = 0; i < 8; i++) pages.push({ cols: [a.cols[i * 2], a.cols[i * 2 + 1]] });
  const mapping = new Map(),
    newCodes = new Set();
  const letter = (n) => {
    let s = '';
    for (let v = n; v >= 0; v = Math.floor(v / 26) - 1) s = String.fromCharCode(97 + (v % 26)) + s;
    return s;
  };
  pages.forEach((page, index) => {
    let n = 0;
    for (const col of page.cols ?? [])
      for (const unit of col) {
        unit.final = unit.html.replace(
          /<span class="eq-number">\((\d+[a-z]+)\)<\/span>/g,
          (match, old) => {
            const code = `${index + 1}${letter(n++)}`;
            if (mapping.has(old)) throw Error('Duplicate source equation ' + old);
            mapping.set(old, code);
            newCodes.add(code);
            return `<span class="eq-number">(${code})</span>`;
          },
        );
      }
  });
  const originalCodes = markups.flatMap((x) =>
    [...x.matchAll(/class="eq-number">\((\d+[a-z]+)\)/g)].map((m) => m[1]),
  );
  for (const old of originalCodes)
    if (!mapping.has(old)) throw Error('Equation omitted from chronology: ' + old);
  function refs(html) {
    return html.replace(
      /(<span class="eq-number">\([^<]+<\/span>)|\((\d+[a-z]+)\)/g,
      (all, label, code) => label ?? `(${mapping.get(code) ?? code})`,
    );
  }
  function renderColumn(col) {
    return col
      .map((u, i) => {
        const continuation =
          i === 0 && !u.first ? u.heading.replace('</strong>', ' · continued</strong>') : '';
        return `<div class="flow-unit ${u.html.includes('data-category="mos"') ? 'mos' : ''}">${continuation}${refs(u.final)}</div>`;
      })
      .join('');
  }
  const output = pages.map((page, index) => {
    const all = page.cols?.flat() ?? [];
    const lo = all[0]?.lecture,
      hi = all.at(-1)?.lecture;
    const titles = [...new Set(all.map((u) => u.title))];
    const firstTitle = titles[0] ?? '',
      lastTitle = titles.at(-1) ?? '';
    const range = lo === hi ? `Lecture ${lo}` : `Lectures ${lo}–${hi}`;
    const route = `${firstTitle}${firstTitle === lastTitle ? '' : ' → ' + lastTitle}`;
    let content;
    if (page.slides) {
      content =
        '<div class="slide-sheet">' +
        [12, 13]
          .map(
            (n) =>
              `<img src="data:image/png;base64,${readFileSync(resolve('public/guides/lecture11-slide-' + n + '.png')).toString('base64')}" alt="Lecture 11 slide ${n}: MOS operating regions"/>`,
          )
          .join('') +
        '<p>Lecture 11, slides 12–13. Slide 12’s example assumes ΦM = ΦS, hence VFB = 0; this is not a general MOS requirement.</p></div>';
    } else
      content = `<div class="columns"><div class="column">${renderColumn(page.cols[0])}</div><div class="column">${renderColumn(page.cols[1])}</div></div>`;
    return `${extraCss}<section class="page eight chronological"><header><h1>ECE 121B &nbsp; Chronological formula reference</h1><div class="meta"><strong>${String(index + 1).padStart(2, '0')} / 08 &nbsp; ${page.slides ? 'Lecture 11 · operating-region slides' : range}</strong><span>Lectures 1–14 / HW 1–5</span></div><div class="route">${route}</div></header>${content}<footer><span>Codes begin with the page number: (7a) is on page 7. Read left column, then right. L# p# = source slide.</span><span>${index + 1}/8</span></footer></section>`;
  });
  for (const html of output)
    for (const [, code] of html.matchAll(/\((\d+[a-z]+)\)/g))
      if (!newCodes.has(code)) throw Error('Unknown remapped reference ' + code);
  writeFileSync(
    resolve(temp, 'chronological-equation-map.json'),
    JSON.stringify(Object.fromEntries(mapping), null, 2),
  );
  console.log(
    `Chronological reflow: ${mapping.size} equations, two reduced lecture slides, max column ${a.max}px; eight pages.`,
  );
  return output;
}
