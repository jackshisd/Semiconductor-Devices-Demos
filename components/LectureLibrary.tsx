import Link from 'next/link';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import lectures from '../lib/lectures.json';

export default function LectureLibrary() {
  return (
    <section className="lecture-library" aria-labelledby="lecture-library-title">
      <div className="section-head">
        <h2 id="lecture-library-title">Lecture slides</h2>
        <span>
          {lectures.length} lectures · {lectures.reduce((sum, item) => sum + item.pages, 0)} slides
        </span>
      </div>
      <div className="lecture-library-grid">
        {lectures.map((lecture, index) => (
          <Link className="lecture-card" key={lecture.id} href={`/lectures/${lecture.id}`}>
            <div className="lecture-card-top">
              <BookOpen size={21} aria-hidden="true" />
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <h3>{lecture.title}</h3>
            <p>{lecture.pages} slides</p>
            <span className="lecture-card-action">
              Read lecture <ArrowUpRight size={16} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
