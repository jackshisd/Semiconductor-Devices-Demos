import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const lectures = JSON.parse(readFileSync('lib/lectures.json', 'utf8'));
const result = [];
for (const lecture of lectures) {
  const task = getDocument({
    data: new Uint8Array(readFileSync('public' + lecture.file)),
    verbosity: 0,
  });
  try {
    const pdf = await task.promise;
    const pages = [];
    for (let page = 1; page <= pdf.numPages; page++) {
      const content = await (await pdf.getPage(page)).getTextContent();
      const text = content.items
        .map((item) => item.str ?? '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      pages.push({ page, text });
    }
    result.push({ id: lecture.id, title: lecture.title, pages });
  } finally {
    await task.destroy();
  }
}
mkdirSync('.openai/slide-review', { recursive: true });
writeFileSync('.openai/slide-review/slides.json', JSON.stringify(result, null, 2) + '\n');
for (const lecture of result)
  console.log(
    lecture.id +
      '\n' +
      lecture.pages.map((page) => page.page + ': ' + page.text.slice(0, 190)).join('\n') +
      '\n',
  );
