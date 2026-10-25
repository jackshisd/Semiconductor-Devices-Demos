import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { homeworkSets } from './homework-solutions.ts';
import { experiments } from './experiments.ts';

test('both homework solution PDFs and their teaching annotations are complete', async () => {
  assert.deepEqual(
    homeworkSets.map((set) => set.id),
    ['hw1', 'hw2'],
  );
  for (const set of homeworkSets) {
    const task = getDocument({
      data: new Uint8Array(readFileSync(new URL('../public' + set.file, import.meta.url))),
    });
    try {
      const pdf = await task.promise;
      assert.equal(pdf.numPages, set.pages);
    } finally {
      await task.destroy();
    }
    assert.ok(set.problems.length >= 4);
    for (const problem of set.problems) {
      assert.ok(problem.page >= 1 && problem.page <= set.pages);
      assert.ok(problem.demos.length > 0);
      assert.ok(problem.demos.every((slug) => experiments.some((demo) => demo.slug === slug)));
      assert.ok(set.annotations.some((note) => note.label.startsWith(`Problem ${problem.number}`)));
    }
    for (const annotation of set.annotations) {
      assert.ok(annotation.page >= 1 && annotation.page <= set.pages);
      assert.ok(annotation.x > 0.05 && annotation.x < 0.95);
      assert.ok(annotation.y > 0.05 && annotation.y < 0.95);
      assert.ok(annotation.text.length > 100);
    }
  }
});
