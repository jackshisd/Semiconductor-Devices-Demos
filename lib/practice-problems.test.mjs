import test from 'node:test';
import assert from 'node:assert/strict';
import {
  practiceProblems,
  isPracticeAnswerCorrect,
  problemDifficulty,
} from './practice-problems.ts';

test('every lecture has ten ordered practice problems with solutions', () => {
  assert.deepEqual(
    Object.keys(practiceProblems),
    Array.from({ length: 8 }, (_, i) => `lecture-${i + 1}`),
  );
  for (const [lecture, problems] of Object.entries(practiceProblems)) {
    assert.equal(problems.length, 10, lecture);
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
