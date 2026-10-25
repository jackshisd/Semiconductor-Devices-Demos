import test from 'node:test';
import assert from 'node:assert/strict';
import {
  practiceProblems,
  isPracticeAnswerCorrect,
  isPracticeResponseComplete,
  parsePracticeNumber,
  practiceAnswerFormat,
  problemDifficulty,
} from './practice-problems.ts';

test('every lecture has fifteen ordered practice problems, including five applied scenarios', () => {
  assert.deepEqual(
    Object.keys(practiceProblems),
    Array.from({ length: 8 }, (_, i) => `lecture-${i + 1}`),
  );
  for (const [lecture, problems] of Object.entries(practiceProblems)) {
    assert.equal(problems.length, 15, lecture);
    assert.equal(problems.filter((problem) => problem.applied).length, 5, lecture);
    assert.deepEqual(
      problems.map((_, index) => problemDifficulty(index)),
      [
        'Easy',
        'Easy',
        'Easy',
        'Easy',
        'Easy',
        'Moderate',
        'Moderate',
        'Moderate',
        'Moderate',
        'Moderate',
        'Challenging',
        'Challenging',
        'Challenging',
        'Challenging',
        'Challenging',
      ],
    );
    for (const [index, problem] of problems.entries()) {
      assert.ok(problem.prompt.length > 20, `${lecture} problem ${index + 1}`);
      assert.ok(problem.solution.length > 30, `${lecture} problem ${index + 1}`);
      assert.ok(['Easy', 'Moderate', 'Challenging'].includes(problemDifficulty(index)));
      assert.equal(isPracticeAnswerCorrect(problem, ''), false);
      if (problem.kind === 'choice') {
        assert.equal(problem.options.length, 4);
        assert.equal(new Set(problem.options).size, 4);
        assert.ok(problem.answer >= 0 && problem.answer < 4);
        assert.equal(isPracticeAnswerCorrect(problem, String(problem.answer)), true);
      } else {
        assert.ok(Number.isFinite(problem.answer));
        assert.ok(problem.tolerance > 0 && problem.tolerance < 0.1);
        assert.equal(isPracticeAnswerCorrect(problem, String(problem.answer)), true);
      }
    }
  }
});

test('scientific notation, decimals, and fractions use appropriate answer formats', () => {
  const large = practiceProblems['lecture-1'][5];
  const small = practiceProblems['lecture-6'][7];
  const decimal = practiceProblems['lecture-2'][10];
  const fraction = practiceProblems['lecture-7'][7];
  assert.equal(practiceAnswerFormat(large), 'scientific');
  assert.equal(practiceAnswerFormat(small), 'scientific');
  assert.equal(practiceAnswerFormat(decimal), 'decimal');
  assert.equal(practiceAnswerFormat(fraction), 'fraction');
  for (const response of ['2e8', '2*10^8', '2 × 10^8', '200000000']) {
    assert.equal(parsePracticeNumber(response), 2e8);
    assert.equal(isPracticeAnswerCorrect(large, response), true);
  }
  assert.equal(isPracticeAnswerCorrect(small, '1.04e-10'), true);
  assert.equal(isPracticeResponseComplete(large, '2e'), false);
  assert.equal(isPracticeResponseComplete(large, 'e8'), false);
  assert.equal(isPracticeResponseComplete(fraction, '0.368'), true);
});
