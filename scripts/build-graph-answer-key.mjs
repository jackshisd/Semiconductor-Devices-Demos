// Build the standalone, print-ready graph answer key for Lectures 1–14.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import katex from 'katex';
import { figures } from './graph-answer-figures.mjs';

const root = resolve('.');
const temp = resolve(root, 'tmp/pdfs');
const output = resolve(root, 'output/pdf');
mkdirSync(temp, { recursive: true });
mkdirSync(output, { recursive: true });
const htmlFile = resolve(temp, 'ee121b-graph-answer-key.html');
const pdfFile = resolve(output, 'ee121b-lectures-1-14-graph-answer-key.pdf');
const chrome = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const esc = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

if (figures.length !== 39 || figures.some((item, i) => item.n !== i + 1)) {
  throw new Error('Expected 39 ordered answer-key figures.');
}

const sections = [
  ['01–08', 'Carriers and transport', 'Lectures 1–4'],
  ['09–19', 'Contacts and PN junctions', 'Lectures 5–8'],
  ['20–27', 'Diode dynamics and applications', 'Lectures 9–10'],
  ['28–39', 'MOS capacitors and MOSFETs', 'Lectures 11–14'],
];
const cover = `<section class="page cover">
  <div class="cover-bar">EE 121B · WHITEBOARD ANSWER KEY</div>
  <h1>Every important graph<br>through Lecture 14</h1>
  <p class="lead">39 labeled drawings with the physical reason and governing relation beside each one.</p>
  <div class="cover-grid">${sections
    .map(
      ([numbers, name, lectures]) =>
        `<div><b>${numbers}</b><strong>${esc(name)}</strong><span>${esc(lectures)}</span></div>`,
    )
    .join('')}</div>
  <div class="cover-notes"><b>How to use this key</b><p>Draw each figure before looking. Compare axes and voltage polarity first, then curve shapes, landmarks, carrier labels, and the physical explanation. All drawings are schematic and not to scale. Concentrations and capacitances use the assumptions stated next to each figure.</p></div>
  <footer><span>EE 121B · graph answer key</span><span>Cover / 40</span></footer>
</section>`;
const pages = figures.map((item) => {
  const equation = katex.renderToString(item.eq, {
    throwOnError: true,
    strict: 'ignore',
    displayMode: true,
  });
  return `<section class="page answer">
    <header><div class="eyebrow">GRAPH ${String(item.n).padStart(2, '0')} / 39 <span>${esc(item.lecture)}</span></div><h2>${esc(item.title)}</h2></header>
    <div class="figure">${item.drawing}</div>
    <div class="bottom"><div class="explanation"><h3>Why the drawing has this shape</h3><p>${esc(item.why)}</p></div><div class="relation"><h3>Key relation or landmark</h3>${equation}</div></div>
    <footer><span>Blue: electrons or first response · Orange: holes or comparison · Green: total or result · Dashed: reference</span><span>${item.n + 1} / 40</span></footer>
  </section>`;
});
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="../../node_modules/katex/dist/katex.min.css"><style>
@page { size: letter landscape; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { color: #182c3b; background: #fff; font-family: Arial, Helvetica, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 11in; height: 8.5in; padding: .34in .38in .3in; position: relative; overflow: hidden; break-after: page; }
.page:last-child { break-after: auto; }
.cover { padding: .55in .65in; background: linear-gradient(130deg, #f4f9fb, #fff 65%); }
.cover-bar { color: #176d72; font-size: 13px; font-weight: 800; letter-spacing: .14em; }
.cover h1 { font-family: Georgia, 'Times New Roman', serif; color: #173548; font-size: 48px; line-height: 1.07; margin: 30px 0 15px; }
.lead { font-size: 18px; color: #45606c; margin: 0 0 34px; }
.cover-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
.cover-grid div { border-left: 5px solid #2672d9; background: #fff; padding: 15px 18px; box-shadow: 0 1px 3px #ccd9df; }
.cover-grid b { color: #a3454b; display: block; font-size: 14px; }
.cover-grid strong { display: block; margin: 4px 0; font-size: 19px; }
.cover-grid span { color: #647781; font-size: 13px; }
.cover-notes { max-width: 870px; margin-top: 32px; border-top: 2px solid #bcd0d8; padding-top: 15px; line-height: 1.42; color: #3d5662; font-size: 15px; }
.cover-notes p { margin: 6px 0 0; }
header { height: 80px; border-bottom: 2px solid #173548; margin-bottom: 13px; }
.eyebrow { font-size: 12px; font-weight: 800; letter-spacing: .12em; color: #176d72; }
.eyebrow span { float: right; color: #687e89; letter-spacing: 0; }
header h2 { font: bold 27px Georgia, 'Times New Roman', serif; margin: 9px 0 0; color: #173548; }
.figure { border: 1px solid #c7d8df; border-radius: 6px; height: 356px; padding: 10px 12px; background: #fff; }
.figure svg { display: block; width: 100%; height: 100%; }
.bottom { margin-top: 16px; display: grid; grid-template-columns: 1.12fr 1fr; gap: 18px; }
.bottom > div { min-height: 120px; padding: 13px 16px; background: #f3f8fa; border-left: 4px solid #2672d9; }
.bottom .relation { border-left-color: #176e64; }
.bottom h3 { text-transform: uppercase; letter-spacing: .08em; font-size: 11px; color: #45606c; margin: 0 0 8px; }
.bottom p { font-size: 14px; line-height: 1.35; margin: 0; }
.relation .katex-display { margin: 11px 0 0; text-align: left; }
.relation .katex { font-size: 15px; }
footer { position: absolute; bottom: .17in; left: .38in; right: .38in; border-top: 1px solid #a7bcc5; padding-top: 5px; color: #6c808b; font-size: 10px; display: flex; justify-content: space-between; }
svg path, svg line { stroke-linecap: round; stroke-linejoin: round; }
svg text { font-family: Arial, Helvetica, sans-serif; paint-order: stroke; stroke: #fff; stroke-width: 2px; stroke-linejoin: round; }
svg text.panel-title { fill: #173548; font-weight: 700; stroke-width: 0; }
svg text.ink, svg text.axis-text { fill: #344b58; }
svg text.blue { fill: #2672d9; font-weight: 700; }
svg text.orange { fill: #c15b2f; font-weight: 700; }
svg text.green { fill: #176e64; font-weight: 700; }
svg text.purple { fill: #79519e; font-weight: 700; }
svg text.gray { fill: #738691; }
svg path.blue, svg line.blue { stroke: #2672d9; }
svg path.orange, svg line.orange { stroke: #d66732; }
svg path.green, svg line.green { stroke: #176e64; }
svg path.purple, svg line.purple { stroke: #79519e; }
svg path.gray, svg line.gray { stroke: #8498a2; }
svg path.axis, svg line.axis { stroke: #526670; }
svg path.guide, svg line.guide { stroke: #aebfc7; }
</style></head><body>${cover}${pages.join('')}</body></html>`;
writeFileSync(htmlFile, html);
rmSync(pdfFile, { force: true });
const result = spawnSync(
  chrome,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--no-pdf-header-footer',
    `--user-data-dir=${resolve(temp, 'chrome-graph-answer-key')}`,
    `--print-to-pdf=${pdfFile}`,
    pathToFileURL(htmlFile).href,
  ],
  { encoding: 'utf8', timeout: 120000 },
);
if (result.error || result.status !== 0)
  throw new Error(`Chrome PDF export failed: ${result.error?.message ?? result.stderr}`);
const task = getDocument({ data: new Uint8Array(readFileSync(pdfFile)), verbosity: 0 });
try {
  const pdf = await task.promise;
  if (pdf.numPages !== 40) throw new Error(`Expected 40 PDF pages, found ${pdf.numPages}.`);
} finally {
  await task.destroy();
}
console.log(`Built ${pdfFile} with 39 labeled graph answers on 40 pages.`);
