import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { experiments } from './experiments.ts';
import {
  demoForSlide,
  slideDemoAssignments,
  lectureAssociations,
  slideForDemo,
  lectureDemos,
} from './slide-demo-assignments.ts';
import { ni } from './physics.ts';

const lectures = JSON.parse(readFileSync(new URL('./lectures.json', import.meta.url), 'utf8'));
test('every bundled lecture is a readable PDF with the advertised page count', async () => {
  assert.equal(new Set(lectures.map((item) => item.id)).size, lectures.length);
  for (const lecture of lectures) {
    const file = new URL('../public' + lecture.file, import.meta.url);
    const task = getDocument({ data: new Uint8Array(readFileSync(file)) });
    try {
      const pdf = await task.promise;
      assert.equal(pdf.numPages, lecture.pages, lecture.id);
    } finally {
      await task.destroy();
    }
  }
});
test('repeated introductory slides defer their demos to Lecture 2', () => {
  const introduction = lectures.find((item) => item.id === 'lecture-1');
  assert.ok(introduction);
  for (let slide = 1; slide <= introduction.pages; slide++)
    assert.equal(demoForSlide(introduction.id, slide), undefined);
  assert.equal(demoForSlide(introduction.id, 0), undefined);
  assert.equal(demoForSlide(introduction.id, NaN), undefined);
});
test('demo assignments refer to existing lectures, slides, and demo routes', () => {
  for (const [id, assignments] of Object.entries(slideDemoAssignments)) {
    const lecture = lectures.find((item) => item.id === id);
    assert.ok(lecture, `Unknown lecture ${id}`);
    for (const [slide, slug] of Object.entries(assignments)) {
      assert.ok(
        Number.isInteger(Number(slide)) && Number(slide) >= 1 && Number(slide) <= lecture.pages,
      );
      assert.ok(
        experiments.some((item) => item.slug === slug),
        `Unknown demo ${slug}`,
      );
    }
  }
  for (const [id, choices] of Object.entries(lectureDemos)) {
    assert.ok(lectures.some((item) => item.id === id));
    assert.equal(new Set(choices).size, choices.length);
    assert.ok(choices.every((slug) => experiments.some((item) => item.slug === slug)));
  }
  assert.deepEqual(lectureDemos['lecture-1'], []);
  assert.equal(lectureDemos['lecture-2'].length, 6);
  assert.ok(!experiments.some((item) => item.slug === 'junction-models'));
});
test('repeated teaching slides open demos only at their later occurrence', () => {
  for (const [earlier, first, later, last] of [
    ['lecture-1', 25, 'lecture-2', 7],
    ['lecture-1', 26, 'lecture-2', 8],
    ['lecture-1', 27, 'lecture-2', 4],
    ['lecture-2', 15, 'lecture-3', 4],
    ['lecture-2', 32, 'lecture-3', 5],
    ['lecture-3', 33, 'lecture-4', 4],
    ['lecture-3', 34, 'lecture-4', 5],
    ['lecture-3', 35, 'lecture-4', 6],
    ['lecture-3', 36, 'lecture-4', 7],
    ['lecture-3', 37, 'lecture-4', 8],
    ['lecture-3', 38, 'lecture-4', 9],
    ['lecture-3', 39, 'lecture-4', 10],
    ['lecture-5', 34, 'lecture-6', 4],
    ['lecture-5', 35, 'lecture-6', 5],
    ['lecture-5', 36, 'lecture-6', 6],
  ]) {
    assert.equal(demoForSlide(earlier, first), undefined, `${earlier} page ${first}`);
    assert.ok(demoForSlide(later, last), `${later} page ${last}`);
  }
});
test('demo categories remain contiguous and routes unique', () => {
  assert.equal(new Set(experiments.map((x) => x.slug)).size, experiments.length);
  const completed = new Set();
  let previous;
  for (const item of experiments) {
    if (previous !== item.group) {
      assert.ok(!completed.has(item.group));
      if (previous) completed.add(previous);
      previous = item.group;
    }
  }
});
test('intrinsic silicon concentration stays finite and rises across the temperature slider', () => {
  let previous = 0;
  for (let T = 200; T <= 600; T++) {
    const value = ni(T);
    assert.ok(Number.isFinite(value) && value > previous);
    previous = value;
  }
  assert.ok(ni(300) > 8e9 && ni(300) < 1e10);
});

test('every demo selector destination opens that same demo and every demo has a slide source', () => {
  const assigned = new Set();
  for (const [lecture, groups] of Object.entries(lectureAssociations)) {
    const seen = new Set();
    for (const [slug, pages] of Object.entries(groups)) {
      assert.ok(pages.length > 0);
      assert.equal(slideForDemo(lecture, slug), pages[0]);
      for (const page of pages) {
        assert.ok(!seen.has(page), 'Ambiguous assignment: ' + lecture + ' ' + page);
        seen.add(page);
        assert.equal(demoForSlide(lecture, page), slug);
      }
      assigned.add(slug);
    }
    assert.equal(demoForSlide(lecture, 1), undefined);
  }
  for (const { slug } of experiments)
    assert.ok(assigned.has(slug), slug + ' has no lecture source');
});
