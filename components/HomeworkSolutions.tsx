'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { experiments } from '../lib/experiments';
import { homeworkSets } from '../lib/homework-solutions';
import { PdfSlide } from './LectureReader';

export default function HomeworkSolutions() {
  const [setId, setSetId] = useState(homeworkSets[0].id);
  const [page, setPage] = useState(1);
  const [ratio, setRatio] = useState(612 / 792);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState('');
  const homework = homeworkSets.find((item) => item.id === setId)!;

  useEffect(() => {
    let disposed = false;
    let destroy: (() => Promise<void>) | undefined;
    setDocument(null);
    setError('');
    const load = async () => {
      const pdfjs = await import('pdfjs-dist');
      if (disposed) return;
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
      const task = pdfjs.getDocument({
        url: homework.file,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        wasmUrl: '/pdfjs/wasm/',
      });
      destroy = () => task.destroy();
      const pdf = await task.promise;
      if (!disposed) setDocument(pdf);
    };
    load().catch((reason) => {
      if (!disposed)
        setError(reason instanceof Error ? reason.message : 'Could not load the solutions.');
    });
    return () => {
      disposed = true;
      void destroy?.();
    };
  }, [homework.file]);

  return (
    <section className="homework-solutions-page">
      <div className="page-heading">
        <span className="eyebrow">WORKED SOLUTIONS</span>
        <h1>Homework solutions</h1>
        <p>
          Read the official HW 1 and HW 2 solutions. Hover, click, or focus the blue dots beside
          worked steps for explanations, then explore the related demos.
        </p>
      </div>
      <div className="homework-set-tabs" role="group" aria-label="Choose homework solutions">
        {homeworkSets.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={setId === item.id}
            onClick={() => {
              setSetId(item.id);
              setPage(1);
            }}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="homework-actions">
        <a href={homework.file} target="_blank" rel="noreferrer">
          Open original PDF ↗
        </a>
        <a href={homework.file} download>
          Download solutions
        </a>
      </div>
      <div className="homework-reader-layout">
        <div className="homework-pdf-reader">
          <div className="homework-page-controls">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              ← Previous
            </button>
            <span>
              Page {page} of {homework.pages}
            </span>
            <button
              type="button"
              disabled={page >= homework.pages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next →
            </button>
          </div>
          {error ? (
            <div className="notice" role="alert">
              {error} Use the PDF links above to read the source.
            </div>
          ) : document ? (
            <div className="pdf-stage homework-pdf-page" style={{ aspectRatio: ratio }}>
              <PdfSlide
                document={document}
                slide={page}
                zoom={1}
                onAspectRatio={setRatio}
                annotations={homework.annotations
                  .filter((annotation) => annotation.page === page)
                  .map(({ x, y, text, label }) => ({ x, y, text, label }))}
              />
            </div>
          ) : (
            <p role="status">Loading solutions…</p>
          )}
        </div>
        <aside className="homework-concepts" aria-label="Problems and related demos">
          <h2>Problems and demos</h2>
          <p>Choose a problem to open the page with its worked solution.</p>
          {homework.problems.map((problem) => (
            <section key={problem.number}>
              <button type="button" onClick={() => setPage(problem.page)}>
                Problem {problem.number}: {problem.title} <span>page {problem.page}</span>
              </button>
              <div className="homework-demo-links">
                {problem.demos.map((slug) => (
                  <Link key={slug} href={`/${slug}`}>
                    {experiments.find((experiment) => experiment.slug === slug)?.title ?? slug} ↗
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </aside>
      </div>
    </section>
  );
}
