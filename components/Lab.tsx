'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, ArrowUpRight, Search, BookOpen } from 'lucide-react';
import { experiments } from '../lib/experiments';
import { siteName } from '../lib/site';
import lectures from '../lib/lectures.json';
import LectureLibrary from './LectureLibrary';
import LectureReader from './LectureReader';
import ExperimentView from './ExperimentView';
import DemoPreview from './DemoPreview';
import MidtermPrep from './MidtermPrep';

export default function Lab({ slug, lectureId }: { slug: string; lectureId?: string }) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('All');
  const menu = useRef<HTMLButtonElement>(null);
  const currentIndex = experiments.findIndex((page) => page.slug === slug);
  const current = experiments[currentIndex];
  const lecture = lectures.find((item) => item.id === lectureId);
  const midtermPrep = slug === 'midterm-prep';
  const groups = ['All', ...new Set(experiments.map((page) => page.group))];
  const filtered = experiments.filter(
    (page) =>
      (group === 'All' || page.group === group) &&
      `${page.title} ${page.subtitle} ${page.group}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const closeOnMobile = () => {
    if (window.matchMedia('(max-width: 850px)').matches) setOpen(false);
  };
  useEffect(closeOnMobile, [slug, lectureId]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        menu.current?.focus();
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside
        id="experiment-navigation"
        className={`sidebar ${open ? '' : 'closed'}`}
        inert={!open}
        aria-hidden={!open}
      >
        <Link href="/" className="brand" onClick={closeOnMobile}>
          <span className="brand-mark">ECE</span>
          <span className="brand-name">
            ECE 121B
            <br />
            Professor Emaminejad
          </span>
        </Link>
        <nav aria-label="Course navigation">
          <Link href="/" className="nav-item" onClick={closeOnMobile}>
            Course overview
          </Link>
          <Link
            href="/midterm-prep"
            className={`nav-item ${midtermPrep ? 'selected' : ''}`}
            aria-current={midtermPrep ? 'page' : undefined}
            onClick={closeOnMobile}
          >
            Midterm prep
          </Link>
          <div className="nav-group">Lecture slides</div>
          {lectures.map((item, index) => (
            <Link
              key={item.id}
              href={'/lectures/' + item.id}
              onClick={closeOnMobile}
              className={'nav-item lecture-nav-item ' + (item.id === lectureId ? 'selected' : '')}
              aria-current={item.id === lectureId ? 'page' : undefined}
            >
              <span className="nav-number">{String(index + 1).padStart(2, '0')}</span>
              <span>{index === 0 ? 'Introduction & refresher' : item.title}</span>
            </Link>
          ))}
          <details className="demo-navigation" open={current ? true : undefined}>
            <summary>
              Demo library <span>{experiments.length}</span>
            </summary>
            {experiments.map((page, index) => (
              <div key={page.slug}>
                {(index === 0 || experiments[index - 1].group !== page.group) && (
                  <div className="nav-group">{page.group}</div>
                )}
                <Link
                  href={`/${page.slug}`}
                  onClick={closeOnMobile}
                  aria-current={slug === page.slug ? 'page' : undefined}
                  className={`nav-item ${slug === page.slug ? 'selected' : ''}`}
                >
                  <DemoPreview slug={page.slug} compact />
                  <span>{page.title}</span>
                </Link>
              </div>
            ))}
          </details>
        </nav>
      </aside>
      <div className="workspace">
        {open && (
          <button
            className="navigation-backdrop"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
        )}
        <header className="topbar">
          <button
            ref={menu}
            className="menu-button"
            aria-controls="experiment-navigation"
            aria-expanded={open}
            aria-label={open ? 'Hide navigation' : 'Show navigation'}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link href="/">{siteName}</Link>
          <span className="topbar-current">
            {(midtermPrep ? 'Midterm prep' : undefined) ??
              lecture?.title ??
              current?.title ??
              `${lectures.length} lectures · ${experiments.length} demos`}
          </span>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className={
            lecture ? 'lecture-main' : current ? `experiment-main page-${slug}` : undefined
          }
        >
          {lecture ? (
            <LectureReader key={lecture.id} lecture={lecture} />
          ) : midtermPrep ? (
            <MidtermPrep />
          ) : current ? (
            <>
              <div className="page-heading">
                <Link href="/" className="back-link">
                  ← All experiments
                </Link>
                <div className="experiment-category">
                  {current.group} · Experiment {String(currentIndex + 1).padStart(2, '0')}
                </div>
                <h1>{current.title}</h1>
                <p>{current.subtitle}</p>
              </div>
              <ExperimentView slug={current.slug} />
              <nav className="experiment-pagination" aria-label="Adjacent experiments">
                {[experiments[currentIndex - 1], experiments[currentIndex + 1]].map(
                  (page, index) =>
                    page ? (
                      <Link key={page.slug} href={`/${page.slug}`}>
                        <span>{index === 0 ? '← Previous experiment' : 'Next experiment →'}</span>
                        <strong>{page.title}</strong>
                      </Link>
                    ) : (
                      <span key={index} />
                    ),
                )}
              </nav>
            </>
          ) : (
            <>
              <section className="hero">
                <h1>ECE 121B Study Guide</h1>
                <p>Slides and demos for Professor Emaminejad’s class.</p>
                <Link href={'/lectures/' + lectures[0].id} className="primary-link">
                  Open lecture 1 <BookOpen size={16} aria-hidden="true" />
                </Link>
                <a href="#demo-library" className="hero-secondary">
                  Browse demos →
                </a>
              </section>
              <LectureLibrary />
              <div id="demo-library" className="section-head">
                <h2>Demo library</h2>
                <span aria-live="polite">
                  {filtered.length} of {experiments.length} experiments
                </span>
              </div>
              <div className="experiment-search">
                <Search size={18} aria-hidden="true" />
                <label className="sr-only" htmlFor="experiment-search">
                  Search experiments
                </label>
                <input
                  id="experiment-search"
                  type="search"
                  placeholder="Search topics, models, or equations…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="category-filters" aria-label="Filter by topic">
                {groups.map((item) => (
                  <button key={item} aria-pressed={group === item} onClick={() => setGroup(item)}>
                    {item}
                  </button>
                ))}
              </div>
              <div className="experiment-list">
                {filtered.map((page) => (
                  <Link href={`/${page.slug}`} key={page.slug} className="experiment-row">
                    <DemoPreview slug={page.slug} />
                    <span className="experiment-copy">
                      <small>{page.group}</small>
                      <strong>{page.title}</strong>
                      <span>{page.subtitle}</span>
                    </span>
                    <ArrowUpRight size={17} />
                  </Link>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="empty-results">
                  <h3>No experiments match that search</h3>
                  <p>Try “junction”, “current”, or “breakdown”.</p>
                  <button
                    className="reset-button"
                    onClick={() => {
                      setQuery('');
                      setGroup('All');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
