'use client';

import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfSlide } from './LectureReader';

const sheets = [
  {
    id: 'eight',
    title: 'Eight-page cheat sheet',
    file: '/guides/ece121b-eight-page-cheat-sheet.pdf',
    pages: 8,
    description:
      'Explicit p-type and n-type MOS equations through Homework 5, with separate NMOS/PMOS currents, total charge, implant dose, and C–V formulas. Crowded graphs have been removed to make room for the paired equations.',
  },
  {
    id: 'full',
    title: 'Four-page cheat sheet',
    file: '/guides/ece121b-four-page-cheat-sheet.pdf',
    pages: 4,
    description:
      'Expanded formulas, original source graphs, brief use notes, and homework references.',
  },
  {
    id: 'short',
    title: 'Short cheat sheet',
    file: '/guides/ece121b-short-cheat-sheet.pdf',
    pages: 2,
    description: 'The original two-page formula sheet for a faster overview.',
  },
] as const;

function SheetPage({ document, page }: { document: PDFDocumentProxy; page: number }) {
  const [ratio, setRatio] = useState(612 / 792);
  return (
    <div className="pdf-stage midterm-pdf-page" style={{ aspectRatio: ratio }}>
      <PdfSlide document={document} slide={page} zoom={1} onAspectRatio={setRatio} />
    </div>
  );
}

export default function CheatSheet() {
  const [sheetId, setSheetId] = useState<(typeof sheets)[number]['id']>('eight');
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [loadedFile, setLoadedFile] = useState('');
  const [error, setError] = useState('');
  const sheet = sheets.find((item) => item.id === sheetId)!;

  useEffect(() => {
    let disposed = false;
    let destroy: (() => Promise<void>) | undefined;
    setDocument(null);
    setError('');
    const load = async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      if (disposed) return;
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
      const task = pdfjs.getDocument({
        url: sheet.file,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        wasmUrl: '/pdfjs/wasm/',
      });
      destroy = () => task.destroy();
      const pdf = await task.promise;
      if (!disposed) {
        setDocument(pdf);
        setLoadedFile(sheet.file);
      }
    };
    load().catch((reason) => {
      if (!disposed)
        setError(reason instanceof Error ? reason.message : 'Could not load the cheat sheet.');
    });
    return () => {
      disposed = true;
      void destroy?.();
    };
  }, [sheet.file]);

  return (
    <section className="cheat-sheet">
      <h1>Cheat sheets</h1>
      <aside className="notice" aria-label="Graph drawing answer key">
        <h2>Lectures 1–14: graph drawing answer key</h2>
        <p>
          Online reference graphs for all 39 topics, with original labels, reading notes, and
          clickable source credits. 55 pages, with one figure per page for readability.
        </p>
        <div className="midterm-prep-actions">
          <a
            className="primary-link"
            href="/guides/ee121b-lectures-1-14-graph-answer-key.pdf"
            download
          >
            Download graph answer key · PDF
          </a>
          <a
            href="/guides/ee121b-lectures-1-14-graph-answer-key.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Open answer key ↗
          </a>
        </div>
      </aside>
      <p>Choose the new eight-page sheet, the earlier four-page version, or the short sheet.</p>
      <div className="cheat-sheet-tabs" role="group" aria-label="Choose a cheat sheet">
        {sheets.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={sheetId === item.id}
            onClick={() => setSheetId(item.id)}
          >
            {item.title} · {item.pages} pages
          </button>
        ))}
      </div>
      <p className="midterm-prep-note">{sheet.description}</p>
      <div className="midterm-prep-actions">
        <a className="primary-link" href={sheet.file} download>
          Download {sheet.title.toLowerCase()} · PDF
        </a>
        <a href={sheet.file} target="_blank" rel="noreferrer">
          Open PDF ↗
        </a>
      </div>
      {error ? (
        <div className="notice" role="alert">
          {error} You can still download the PDF above.
        </div>
      ) : document && loadedFile === sheet.file ? (
        <div className="midterm-sheet-pages" aria-label={sheet.title}>
          {Array.from({ length: document.numPages }, (_, i) => (
            <SheetPage key={i} document={document} page={i + 1} />
          ))}
        </div>
      ) : (
        <p role="status">Loading {sheet.title.toLowerCase()}…</p>
      )}
    </section>
  );
}
