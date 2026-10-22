// Install Tectonic or set TECTONIC to its executable path. Website builds use the committed PDF.
import { spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
mkdirSync('output/pdf', { recursive: true });
const result = spawnSync(
  process.env.TECTONIC || 'tectonic',
  ['guides/midterm/main.tex', '--outdir', 'output/pdf'],
  { stdio: 'inherit' },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const pdf = getDocument({
  data: new Uint8Array(readFileSync('output/pdf/main.pdf')),
  verbosity: 0,
});
try {
  if ((await pdf.promise).numPages !== 2)
    throw Error('The formula sheet must be exactly two pages.');
} finally {
  await pdf.destroy();
}
for (const path of [
  'output/pdf/ece121b-midterm-formula-sheet.pdf',
  'public/guides/ece121b-midterm-formula-sheet.pdf',
])
  copyFileSync('output/pdf/main.pdf', path);
