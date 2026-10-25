import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { experiments } from '../lib/experiments.ts';
import { demoForSlide } from '../lib/slide-demo-assignments.ts';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const lectures = JSON.parse(readFileSync(new URL('../lib/lectures.json', import.meta.url), 'utf8'));

const root = resolve('out');
const routes = new Set([
  'index',
  '404',
  'midterm-prep',
  'homework-solutions',
  'credits',
  ...experiments.map((page) => page.slug),
]);
for (const file of readdirSync(root).filter((name) => name.endsWith('.html'))) {
  assert.ok(routes.has(file.slice(0, -5)), `Unexpected stale route: ${file}`);
}
for (const page of [{ slug: 'index', title: 'Semiconductor physics' }, ...experiments]) {
  const html = readFileSync(resolve(root, `${page.slug}.html`), 'utf8');
  assert.match(html, /<h1\b/, `${page.slug}: missing page heading`);
  assert.match(html, /<title>[^<]+<\/title>/, `${page.slug}: missing metadata`);
  assert.doesNotMatch(html, /class="katex-error"/, `${page.slug}: invalid formula`);
  assert.doesNotMatch(
    html,
    /<(?:path|line|circle|rect)\b[^>]*(?:NaN|Infinity)/,
    `${page.slug}: invalid graph geometry`,
  );
  for (const match of html.matchAll(/(?:src|href)="(\/_next\/[^"?#]+)"/g)) {
    assert.ok(
      existsSync(resolve(root, '.' + decodeURIComponent(match[1]))),
      `${page.slug}: missing asset ${match[1]}`,
    );
  }
  if (page.slug !== 'index') {
    assert.match(
      html,
      /aria-label="Experiment controls"/,
      `${page.slug}: missing recovery controls`,
    );
  }
}
console.log(
  `Verified home page and ${experiments.length} exported experiments, formulas, controls, and assets.`,
);
assert.ok(
  !existsSync(resolve(root, 'junction-models.html')),
  'Removed Junction Models route was exported.',
);
for (const lecture of lectures) {
  const html = readFileSync(resolve(root, `lectures/${lecture.id}.html`), 'utf8');
  assert.match(html, /slide reader/, `${lecture.id}: missing PDF reader`);
  assert.match(html, /Slide viewing area/, `${lecture.id}: missing slide viewing area`);
  assert.equal(
    readFileSync(resolve(root, '.' + lecture.file))
      .subarray(0, 4)
      .toString(),
    '%PDF',
    `${lecture.id}: invalid PDF asset`,
  );
  if (demoForSlide(lecture.id, 1))
    assert.match(html, /aria-label="Experiment controls"/, `${lecture.id}: missing default demo`);
}
assert.ok(existsSync(resolve(root, 'pdfjs/pdf.worker.min.mjs')), 'Missing PDF rendering worker.');
console.log(`Verified ${lectures.length} lecture readers, bundled PDFs, and default demos.`);
const prepHtml = readFileSync(resolve(root, 'midterm-prep.html'), 'utf8');
assert.match(prepHtml, /Midterm prep/, 'Missing midterm preparation page.');
assert.match(prepHtml, /Download formula sheet/, 'Missing formula sheet download.');
const guide = getDocument({
  data: new Uint8Array(readFileSync(resolve(root, 'guides/ece121b-midterm-formula-sheet.pdf'))),
  verbosity: 0,
});
try {
  assert.equal((await guide.promise).numPages, 2, 'The midterm formula sheet must have two pages.');
} finally {
  await guide.destroy();
}
console.log('Verified midterm preparation page and two-page formula sheet.');
const homeworkHtml = readFileSync(resolve(root, 'homework-solutions.html'), 'utf8');
assert.match(homeworkHtml, /Homework solutions/, 'Missing homework solutions page.');
for (const name of ['hw1-solutions.pdf', 'hw2-solutions.pdf']) {
  const bytes = readFileSync(resolve(root, 'homework', name));
  assert.equal(bytes.subarray(0, 4).toString(), '%PDF', `${name}: invalid PDF asset`);
}
assert.match(readFileSync(resolve(root, 'credits.html'), 'utf8'), /Jack Shi, 2026 Fall/);
console.log('Verified homework solutions, both PDFs, and credits page.');
