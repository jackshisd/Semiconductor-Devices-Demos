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
  duplicateSlideGroups,
} from './slide-demo-assignments.ts';
import { ni } from './physics.ts';
import { donorCarrierState } from './donor-freeze-out.ts';
import { explanationForSlide, nonMaterialSlides } from './slide-explanations.ts';

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
test('repeated introductory slides share their Lecture 2 demos', () => {
  assert.equal(demoForSlide('lecture-1', 25), 'intrinsic-carriers');
  assert.equal(demoForSlide('lecture-1', 26), 'intrinsic-carriers');
  assert.equal(demoForSlide('lecture-1', 27), 'intrinsic-carriers');
  assert.equal(demoForSlide('lecture-1', 23), undefined);
  assert.equal(demoForSlide('lecture-1', 0), undefined);
  assert.equal(demoForSlide('lecture-1', NaN), undefined);
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
  assert.deepEqual(lectureDemos['lecture-1'], ['intrinsic-carriers']);
  assert.equal(lectureDemos['lecture-2'].length, 10);
  assert.equal(demoForSlide('lecture-2', 13), 'electrostatic-potential');
  assert.equal(demoForSlide('lecture-2', 16), 'material-band-comparison');
  assert.equal(demoForSlide('lecture-2', 26), 'carrier-temperature-regions');
  assert.equal(demoForSlide('lecture-2', 32), 'boltzmann-approximation');
  assert.equal(demoForSlide('lecture-3', 35), 'matthiessen-rule');
  assert.equal(demoForSlide('lecture-3', 36), 'screening-effect');
  assert.equal(demoForSlide('lecture-3', 39), 'conductivity-resistivity');
  assert.equal(demoForSlide('lecture-4', 7), 'screening-effect');
  assert.equal(demoForSlide('lecture-8', 15), 'high-level-injection');
  assert.equal(demoForSlide('lecture-4', 22), 'einstein-relation');
  assert.equal(demoForSlide('lecture-4', 23), 'einstein-relation');
  assert.equal(demoForSlide('lecture-4', 26), 'generation-processes');
  assert.equal(demoForSlide('lecture-4', 27), 'recombination-processes');
  assert.equal(demoForSlide('lecture-4', 28), 'direct-indirect-bandgap');
  assert.ok(!experiments.some((item) => item.slug === 'junction-models'));
});
test('duplicate teaching slides show the same demo in every lecture', () => {
  for (const group of duplicateSlideGroups) {
    const demos = group.map(([lecture, page]) => demoForSlide(lecture, page));
    assert.ok(
      demos.every((demo) => demo === demos[0]),
      JSON.stringify(group),
    );
  }
  assert.equal(demoForSlide('lecture-2', 15), 'hole-distribution');
  assert.equal(demoForSlide('lecture-3', 34), 'impurity-scattering');
  assert.equal(demoForSlide('lecture-4', 10), 'conductivity-resistivity');
  assert.equal(demoForSlide('lecture-5', 34), 'schottky');
});
test('every instructional slide after Lecture 1 has an explanation', () => {
  for (const lecture of lectures) {
    for (let slide = 1; slide <= lecture.pages; slide++) {
      const explanation = explanationForSlide(lecture.id, slide);
      if (lecture.id === 'lecture-1' || nonMaterialSlides[lecture.id]?.includes(slide)) {
        assert.equal(explanation, undefined, `${lecture.id} slide ${slide}`);
      } else {
        assert.ok(explanation && explanation.length >= 100, `${lecture.id} slide ${slide}`);
      }
    }
  }
  for (const group of duplicateSlideGroups) {
    const copies = group
      .map(([lecture, slide]) => explanationForSlide(lecture, slide))
      .filter(Boolean);
    assert.ok(
      copies.every((copy) => copy === copies[0]),
      JSON.stringify(group),
    );
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

test('donor freeze-out model crosses the extrinsic and intrinsic regions', () => {
  const ND = 1e15;
  const cold = donorCarrierState(20, ND);
  const room = donorCarrierState(300, ND);
  const hot = donorCarrierState(600, ND);
  assert.equal(cold.regime, 'Freeze-out');
  assert.ok(cold.n < 0.01 * ND);
  assert.equal(room.regime, 'Extrinsic');
  assert.ok(Math.abs(room.n / ND - 1) < 0.01);
  assert.equal(hot.regime, 'Intrinsic');
  assert.ok(hot.n > ND && hot.intrinsic > ND);
  for (const state of [cold, room, hot]) {
    assert.ok(Number.isFinite(state.n) && state.n > 0);
    assert.ok(Math.abs(state.n - state.ionized - state.intrinsic ** 2 / state.n) / state.n < 1e-10);
  }
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
