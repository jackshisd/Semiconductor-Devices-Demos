'use client';

import { useState } from 'react';
import {
  isPracticeAnswerCorrect,
  isPracticeResponseComplete,
  practiceProblems,
  practiceAnswerFormat,
  problemDifficulty,
  type PracticeProblem,
} from '../lib/practice-problems';

const lectureIds = Object.keys(practiceProblems);
const superscriptDigits: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

function displayedNumberAnswer(problem: Extract<PracticeProblem, { kind: 'number' }>) {
  if (practiceAnswerFormat(problem) === 'scientific') {
    const [coefficient, exponent] = problem.answer.toExponential(3).split('e');
    const power = String(Number(exponent))
      .split('')
      .map((digit) => superscriptDigits[digit])
      .join('');
    return `${Number(coefficient)} × 10${power} ${problem.unit}`;
  }
  return `${Number(problem.answer.toPrecision(4))} ${problem.unit}`;
}

function AnswerField({
  problem,
  id,
  value,
  onChange,
}: {
  problem: PracticeProblem;
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  if (problem.kind === 'choice')
    return (
      <fieldset className="practice-options">
        <legend className="sr-only">Choose an answer</legend>
        {problem.options.map((option, index) => (
          <label key={option}>
            <input
              type="radio"
              name={id}
              value={index}
              checked={value === String(index)}
              onChange={() => onChange(String(index))}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
    );
  if (practiceAnswerFormat(problem) === 'scientific') {
    const separator = value.search(/[eE]/);
    const coefficient = separator < 0 ? value : value.slice(0, separator);
    const exponent = separator < 0 ? '' : value.slice(separator + 1);
    return (
      <fieldset className="practice-scientific-answer">
        <legend>Your answer</legend>
        <div>
          <label htmlFor={`${id}-coefficient`}>
            Coefficient
            <input
              id={`${id}-coefficient`}
              type="text"
              inputMode="decimal"
              value={coefficient}
              onChange={(event) => {
                const entered = event.target.value;
                const multiplied = entered.match(/^(.+?)\s*[*×]\s*10\s*\^\s*([+-]?\d+)$/);
                if (multiplied) onChange(`${multiplied[1]}e${multiplied[2]}`);
                else if (/[eE]/.test(entered)) onChange(entered);
                else onChange(`${entered}e${exponent}`);
              }}
              placeholder="2"
            />
          </label>
          <span className="practice-scientific-symbol" aria-hidden="true">
            × 10
          </span>
          <label htmlFor={`${id}-exponent`}>
            Power of 10
            <input
              id={`${id}-exponent`}
              type="text"
              inputMode="decimal"
              value={exponent}
              onChange={(event) => onChange(`${coefficient}e${event.target.value}`)}
              placeholder="8"
            />
          </label>
          <small>{problem.unit}</small>
        </div>
        <p>For 2 × 10⁸, enter 2 and 8.</p>
      </fieldset>
    );
  }
  return (
    <label className="practice-number-answer">
      {practiceAnswerFormat(problem) === 'fraction' ? 'Fraction (0 to 1)' : 'Your answer'}
      <span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            practiceAnswerFormat(problem) === 'fraction' ? 'e.g. 0.368' : 'Enter a number'
          }
        />
        <small>{problem.unit}</small>
      </span>
    </label>
  );
}

export default function PracticeProblems() {
  const [lectureId, setLectureId] = useState('lecture-1');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const problems = practiceProblems[lectureId];
  const keyFor = (index: number) => `${lectureId}-${index + 1}`;
  const updateAnswer = (key: string, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setChecked((current) => ({ ...current, [key]: false }));
    setScores((current) => {
      const next = { ...current };
      delete next[lectureId];
      return next;
    });
  };
  const score = scores[lectureId];

  return (
    <section className="practice-section" aria-labelledby="practice-heading">
      <div className="practice-heading">
        <div>
          <span className="eyebrow">ACTIVE PRACTICE</span>
          <h2 id="practice-heading">Problems by lecture</h2>
          <p>
            Ten problems per lecture progress from easy to challenging. Enter your answer in the
            format shown, then check your work. Solutions and scores can be revealed at any time.
          </p>
        </div>
      </div>
      <div
        className="practice-lecture-tabs"
        role="group"
        aria-label="Choose a lecture practice set"
      >
        {lectureIds.map((id, index) => (
          <button
            key={id}
            type="button"
            aria-pressed={id === lectureId}
            onClick={() => setLectureId(id)}
          >
            Lecture {index + 1}
          </button>
        ))}
      </div>
      <div className="practice-summary">
        <span>Lecture {lectureIds.indexOf(lectureId) + 1} · 10 problems</span>
        <div>
          <button
            type="button"
            onClick={() => {
              setScores((current) => ({
                ...current,
                [lectureId]: problems.reduce(
                  (total, problem, index) =>
                    total + Number(isPracticeAnswerCorrect(problem, answers[keyFor(index)] ?? '')),
                  0,
                ),
              }));
              setChecked((current) => ({
                ...current,
                ...Object.fromEntries(problems.map((_, index) => [keyFor(index), true])),
              }));
            }}
          >
            Show my score
          </button>
          <button
            type="button"
            onClick={() =>
              setShowAll((current) => ({ ...current, [lectureId]: !current[lectureId] }))
            }
          >
            {showAll[lectureId] ? 'Hide all solutions' : 'Reveal all solutions'}
          </button>
        </div>
      </div>
      {score !== undefined && (
        <div className="practice-score" role="status">
          Score: {score} / {problems.length} ({Math.round((score / problems.length) * 100)}%) ·
          Unanswered problems count as incorrect.
        </div>
      )}
      <div className="practice-problems">
        {problems.map((problem, index) => {
          const key = keyFor(index);
          const value = answers[key] ?? '';
          const correct = isPracticeAnswerCorrect(problem, value);
          const visibleSolution = showAll[lectureId] || revealed[key];
          return (
            <article className="practice-problem" key={key}>
              <div className="practice-problem-heading">
                <span>Problem {index + 1}</span>
                <span
                  className={`practice-difficulty difficulty-${problemDifficulty(index).toLowerCase()}`}
                >
                  {problemDifficulty(index)}
                </span>
              </div>
              <h3>{problem.prompt}</h3>
              <AnswerField
                problem={problem}
                id={`answer-${key}`}
                value={value}
                onChange={(answer) => updateAnswer(key, answer)}
              />
              <div className="practice-problem-actions">
                <button
                  type="button"
                  disabled={!isPracticeResponseComplete(problem, value)}
                  onClick={() => setChecked((current) => ({ ...current, [key]: true }))}
                >
                  Check answer
                </button>
                <button
                  type="button"
                  disabled={Boolean(showAll[lectureId])}
                  onClick={() => setRevealed((current) => ({ ...current, [key]: !current[key] }))}
                >
                  {showAll[lectureId]
                    ? 'Solution shown'
                    : visibleSolution
                      ? 'Hide solution'
                      : 'Show solution'}
                </button>
              </div>
              {checked[key] && (
                <p
                  className={`practice-feedback ${correct ? 'is-correct' : 'is-incorrect'}`}
                  role="status"
                >
                  {correct
                    ? 'Correct.'
                    : isPracticeResponseComplete(problem, value)
                      ? 'Not quite. Try again or reveal the solution.'
                      : 'No answer entered.'}
                </p>
              )}
              {visibleSolution && (
                <div className="practice-solution">
                  <strong>
                    Answer:{' '}
                    {problem.kind === 'choice'
                      ? problem.options[problem.answer]
                      : displayedNumberAnswer(problem)}
                  </strong>
                  <p>{problem.solution}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
