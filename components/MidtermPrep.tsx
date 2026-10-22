'use client';
import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfSlide } from './LectureReader';
const file = '/guides/ece121b-midterm-formula-sheet.pdf';
function SheetPage({ document, page }: { document: PDFDocumentProxy; page: number }) {
  const [ratio, setRatio] = useState(612 / 792);
  return (
    <div className="pdf-stage midterm-pdf-page" style={{ aspectRatio: ratio }}>
      <PdfSlide document={document} slide={page} zoom={1} onAspectRatio={setRatio} />
    </div>
  );
}
export default function MidtermPrep() {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    let destroy: (() => Promise<void>) | undefined;
    const load = async () => {
      const pdfjs = await import('pdfjs-dist');
      if (disposed) return;
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
      const task = pdfjs.getDocument({
        url: file,
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
        setError(reason instanceof Error ? reason.message : 'Could not load the formula sheet.');
    });
    return () => {
      disposed = true;
      void destroy?.();
    };
  }, []);
  return (
    <section className="midterm-prep">
      <h1>Midterm prep</h1>
      <p>A two-page formula sheet based on the supplied lecture slides, covering Lectures 1–8.</p>
      <div className="midterm-prep-actions">
        <a className="primary-link" href={file} download>
          Download formula sheet · PDF · 2 pages
        </a>
        <a href={file} target="_blank" rel="noreferrer">
          Open PDF ↗
        </a>
      </div>
      <p className="midterm-prep-note">
        Includes carrier statistics, doping, drift and diffusion, continuity, quasi-Fermi levels,
        junction electrostatics, Schottky contacts, capacitance, diode current and breakdown.
        Assumptions and slide references are included.
      </p>
      {error ? (
        <div className="notice" role="alert">
          {error} You can still download the PDF above.
        </div>
      ) : document ? (
        <div className="midterm-sheet-pages" aria-label="Two-page midterm formula sheet">
          {Array.from({ length: document.numPages }, (_, i) => (
            <SheetPage key={i} document={document} page={i + 1} />
          ))}
        </div>
      ) : (
        <p role="status">Loading formula sheet…</p>
      )}
    </section>
  );
}
