import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const source = resolve('class slides');
const destination = resolve('public/lectures');
const manifest = resolve('lib/lectures.json');
const titles = {
  1: 'Introduction · Semiconductor refresher',
  2: 'Lecture 2 · Energy bands and carriers',
  3: 'Lecture 3 · Carrier statistics and drift',
  4: 'Lecture 4 · Scattering and carrier actions',
  5: 'Lecture 5 · Continuity and metal contacts',
  6: 'Lecture 6 · Schottky and PN junctions',
  7: 'Lecture 7 · PN diode current',
  8: 'Lecture 8 · Nonideal diodes and breakdown',
};
mkdirSync('public/pdfjs', { recursive: true });
cpSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', 'public/pdfjs/pdf.worker.min.mjs');
cpSync('node_modules/pdfjs-dist/LICENSE', 'public/pdfjs/LICENSE');
for (const folder of ['cmaps', 'standard_fonts', 'wasm'])
  cpSync(`node_modules/pdfjs-dist/${folder}`, `public/pdfjs/${folder}`, { recursive: true });
if (!existsSync(source)) {
  if (existsSync(manifest)) {
    console.log('Using the bundled lecture slides (local class slides folder is absent).');
    process.exit(0);
  }
  throw new Error('Add lecture PDFs to class slides before syncing.');
}
mkdirSync(destination, { recursive: true });
const files = readdirSync(source)
  .filter((name) => /\.pdf$/i.test(name))
  .sort((a, b) => {
    const order = (name) =>
      /introductory/i.test(name) ? 1 : Number(name.match(/lecture\s*(\d+)/i)?.[1] ?? 1000);
    return order(a) - order(b) || a.localeCompare(b, undefined, { numeric: true });
  });
if (!files.length) throw new Error('No lecture PDFs found in class slides.');
const lectures = [];
for (const file of files) {
  const number = /introductory/i.test(file) ? 1 : Number(file.match(/lecture\s*(\d+)/i)?.[1]);
  const id = Number.isFinite(number)
    ? `lecture-${number}`
    : file
        .replace(/\.pdf$/i, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
  if (lectures.some((lecture) => lecture.id === id)) throw new Error(`Duplicate lecture ID: ${id}`);
  const task = getDocument({
    data: new Uint8Array(readFileSync(resolve(source, file))),
  });
  const document = await task.promise;
  lectures.push({
    id,
    title: titles[number] ?? file.replace(/\.pdf$/i, ''),
    file: `/lectures/${id}.pdf`,
    pages: document.numPages,
    sourceFile: file,
  });
  await task.destroy();
  cpSync(resolve(source, file), resolve(destination, `${id}.pdf`));
}
writeFileSync(manifest, JSON.stringify(lectures, null, 2) + '\n');
console.log(
  `Bundled ${lectures.length} lectures (${lectures.reduce((sum, lecture) => sum + lecture.pages, 0)} slides) and the PDF reader worker.`,
);
