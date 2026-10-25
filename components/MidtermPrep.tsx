import Link from 'next/link';
import PracticeProblems from './PracticeProblems';

export default function MidtermPrep() {
  return (
    <section className="midterm-prep">
      <h1>Midterm prep</h1>
      <p>Work through ten practice problems for each lecture, from easy to challenging.</p>
      <Link className="primary-link" href="/cheat-sheet">
        Open the cheat sheets
      </Link>
      <PracticeProblems />
    </section>
  );
}
