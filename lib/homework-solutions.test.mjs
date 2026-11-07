import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { homeworkSets } from './homework-solutions.ts';
import { experiments } from './experiments.ts';

test('all homework solution PDFs and their teaching annotations are complete', async () => {
  assert.deepEqual(
    homeworkSets.map((set) => set.id),
    ['hw1', 'hw2', 'hw3'],
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

test('Homework 3 covers every problem and flags printed calculation inconsistencies', () => {
  const hw3 = homeworkSets.find((set) => set.id === 'hw3');
  assert.ok(hw3);
  assert.deepEqual(
    hw3.problems.map((problem) => problem.number),
    [1, 2, 3, 4, 5],
  );
  assert.deepEqual([...new Set(hw3.annotations.map((note) => note.page))], [1, 2, 3, 4, 5, 6]);
  const notes = hw3.annotations.map((note) => note.text).join(' ');
  assert.match(notes, /nᵢ²/);
  assert.match(notes, /0\.84 V/);
  assert.match(notes, /3\.4 pF/);
});
