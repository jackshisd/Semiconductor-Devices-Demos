'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, ExternalLink, List, Minus, Plus } from 'lucide-react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import lectures from '../lib/lectures.json';
import { experiments, type ExperimentSlug } from '../lib/experiments';
import { demoForSlide, slideForDemo, lectureDemos } from '../lib/slide-demo-assignments';
import { explanationForSlide } from '../lib/slide-explanations';
import ExperimentView from './ExperimentView';
import { ControlsHostContext } from './DemoPresentation';

type Lecture = (typeof lectures)[number];
export type PdfAnnotation = { x: number; y: number; text: string; label?: string };

function nearestWhitePatch(
  context: CanvasRenderingContext2D,
  point: { x: number; y: number },
  size: { width: number; height: number },
  pixelRatio: number,
) {
  const radius = Math.ceil(17 * pixelRatio);
  const step = Math.max(1, Math.round(3 * pixelRatio));
  let best = point;
  let bestScore = -Infinity;
  for (let distance = 0; distance <= 180; distance += 12) {
    for (let direction = 0; direction < (distance === 0 ? 1 : 16); direction++) {
      const angle = (direction * Math.PI) / 8;
      const x = point.x * size.width + Math.cos(angle) * distance;
      const y = point.y * size.height + Math.sin(angle) * distance;
      if (x < 19 || y < 19 || x > size.width - 19 || y > size.height - 19) continue;
      const left = Math.round(x * pixelRatio) - radius;
      const top = Math.round(y * pixelRatio) - radius;
      let pixels: Uint8ClampedArray;
      try {
        pixels = context.getImageData(left, top, radius * 2, radius * 2).data;
      } catch {
        return best;
      }
      let white = 0;
      let sampled = 0;
      for (let row = 0; row < radius * 2; row += step) {
        for (let column = 0; column < radius * 2; column += step) {
          const offset = (row * radius * 2 + column) * 4;
          if (
            pixels[offset + 3] < 16 ||
            (pixels[offset] > 242 && pixels[offset + 1] > 242 && pixels[offset + 2] > 242)
          )
            white++;
          sampled++;
        }
      }
      const fraction = white / sampled;
      const candidate = { x: x / size.width, y: y / size.height };
      if (fraction >= 0.985) return candidate;
      const score = fraction - distance / 900;
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
  }
  return best;
}

export function PdfSlide({
  document,
  slide,
  zoom,
  onAspectRatio,
  explanation,
  annotations,
  showAnnotations = true,
}: {
  document: PDFDocumentProxy;
  slide: number;
  zoom: number;
  onAspectRatio: (ratio: number) => void;
  explanation?: string;
  annotations?: PdfAnnotation[];
  showAnnotations?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderQueue = useRef<Promise<void>>(Promise.resolve());
  const [width, setWidth] = useState(800);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState('');
  const [surface, setSurface] = useState({ width: 800, height: 600 });
  const [placedDots, setPlacedDots] = useState<{ x: number; y: number }[]>([]);
  const [openAnnotation, setOpenAnnotation] = useState<number | null>(null);
  const explanationId = useId();
  useEffect(() => {
    if (!showAnnotations) setOpenAnnotation(null);
  }, [showAnnotations]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(1, entries[0].contentRect.width)),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false;
    let task: RenderTask | undefined;
    setRendering(true);
    setError('');
    setOpenAnnotation(null);
    const render = async () => {
      const page = await document.getPage(slide);
      if (disposed || !canvas.current) return;
      const original = page.getViewport({ scale: 1 });
      onAspectRatio(original.width / original.height);
      const viewport = page.getViewport({ scale: (width / original.width) * zoom });
      let explanationAnchor = { x: 0.7, y: 0.45 };
      if (explanation) {
        try {
          const content = await page.getTextContent();
          const candidates = content.items
            .filter(
              (
                item,
              ): item is (typeof content.items)[number] & {
                str: string;
                width: number;
                transform: number[];
              } => 'str' in item,
            )
            .map((item) => {
              const [x, y] = original.convertToViewportPoint(item.transform[4], item.transform[5]);
              return {
                x: x / original.width,
                y: y / original.height,
                length: item.str.trim().length,
              };
            })
            .filter((item) => item.length > 12 && item.y > 0.18 && item.y < 0.82);
          const anchor = candidates.sort(
            (a, b) => Math.abs(a.y - 0.48) - Math.abs(b.y - 0.48) + (b.length - a.length) * 0.0005,
          )[0];
          if (anchor)
            explanationAnchor = { x: Math.max(0.12, Math.min(0.82, anchor.x)), y: anchor.y };
        } catch {
          // A text-extraction error should not prevent the original slide from rendering.
        }
      }
      if (disposed || !canvas.current) return;
      setSurface({ width: viewport.width, height: viewport.height });
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        2,
        Math.sqrt(8_000_000 / (viewport.width * viewport.height)),
      );
      const target = canvas.current;
      target.width = Math.floor(viewport.width * pixelRatio);
      target.height = Math.floor(viewport.height * pixelRatio);
      target.style.width = `${viewport.width}px`;
      target.style.height = `${viewport.height}px`;
      const context = target.getContext('2d');
      if (!context) throw Error('Your browser could not create the slide canvas.');
      task = page.render({
        canvas: target,
        canvasContext: context,
        viewport,
        transform: pixelRatio === 1 ? undefined : [pixelRatio, 0, 0, pixelRatio, 0, 0],
      });
      await task.promise;
      if (!disposed) {
        const targets =
          annotations ?? (explanation ? [{ ...explanationAnchor, text: explanation }] : []);
        setPlacedDots(
          targets.map((annotation) => nearestWhitePatch(context, annotation, viewport, pixelRatio)),
        );
        setRendering(false);
      }
    };
    const pending = renderQueue.current.then(() => (disposed ? undefined : render()));
    renderQueue.current = pending.catch(() => undefined);
    pending.catch((reason) => {
      if (!disposed) {
        setError(reason instanceof Error ? reason.message : 'The slide could not be rendered.');
        setRendering(false);
      }
    });
    return () => {
      disposed = true;
      task?.cancel();
    };
  }, [document, slide, width, zoom, onAspectRatio, explanation]);
  const visibleAnnotations =
    annotations ?? (explanation ? [{ x: 0.7, y: 0.45, text: explanation }] : []);
  return (
    <div ref={container} className="pdf-slide-container" aria-busy={rendering}>
      <div className="pdf-canvas-scroll">
        <div className="pdf-slide-surface" style={surface}>
          <canvas
            ref={canvas}
            role="img"
            aria-label={`Slide ${slide} of ${document.numPages}`}
            style={{ visibility: rendering || error ? 'hidden' : 'visible' }}
          />
          {showAnnotations &&
            !rendering &&
            !error &&
            visibleAnnotations.map((annotation, index) => (
              <div
                key={`${slide}-${index}`}
                className={`slide-explanation ${openAnnotation === index ? 'is-open' : ''}`}
                style={{
                  left: `${(placedDots[index]?.x ?? annotation.x) * 100}%`,
                  top: `${(placedDots[index]?.y ?? annotation.y) * 100}%`,
                }}
              >
                <button
                  type="button"
                  className="slide-explanation-dot"
                  aria-label={annotation.label ?? `Explanation for slide ${slide}`}
                  aria-describedby={`${explanationId}-${index}`}
                  aria-expanded={openAnnotation === index}
                  onClick={() => setOpenAnnotation((open) => (open === index ? null : index))}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setOpenAnnotation(null);
                  }}
                >
                  ?
                </button>
                <div
                  id={`${explanationId}-${index}`}
                  className={`slide-explanation-popover ${(placedDots[index]?.x ?? annotation.x) > 0.58 ? 'align-right' : ''} ${(placedDots[index]?.y ?? annotation.y) > 0.55 ? 'align-above' : ''}`}
                  role="tooltip"
                >
                  <strong>{annotation.label ?? `Slide ${slide} explained`}</strong>
                  <p>{annotation.text}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
      {rendering && (
        <div className="pdf-loading" role="status">
          Rendering slide {slide}…
        </div>
      )}
      {error && (
        <div className="pdf-render-error" role="alert">
          {error} Use “Open PDF” to read the original slides.
        </div>
      )}
    </div>
  );
}

export default function LectureReader({ lecture }: { lecture: Lecture }) {
  const router = useRouter();
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [slide, setSlide] = useState(1);
  const [draft, setDraft] = useState('1');
  const [zoom, setZoom] = useState(1);
  const [showExplanations, setShowExplanations] = useState(true);
  const [indexOpen, setIndexOpen] = useState(false);
  const [slideAspectRatio, setSlideAspectRatio] = useState(4 / 3);
  const [controlsHost, setControlsHost] = useState<HTMLDivElement | null>(null);
  const pageCount = document?.numPages ?? lecture.pages;
  const index = lectures.findIndex((item) => item.id === lecture.id);
  const studyLayout = useRef<HTMLDivElement>(null);
  const reader = useRef<HTMLElement>(null);
  const assignedDemo = demoForSlide(lecture.id, slide);
  const explanation = explanationForSlide(lecture.id, slide);
  const choices = lectureDemos[lecture.id] ?? [];
  const demo = experiments.find((item) => item.slug === assignedDemo);
  useEffect(() => {
    if (!reader.current || !studyLayout.current) return;
    const update = () => {
      studyLayout.current?.style.setProperty(
        '--lecture-panel-height',
        `${reader.current?.getBoundingClientRect().height ?? 0}px`,
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(reader.current);
    update();
    return () => observer.disconnect();
  }, []);
  const goTo = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.max(1, Math.min(pageCount, Math.trunc(value)));
    setSlide(next);
    setDraft(String(next));
    const url = new URL(window.location.href);
    url.hash = `slide=${next}`;
    window.history.replaceState(null, '', url);
  };
  useEffect(() => {
    const fromHash = () => {
      const value = Number(new URLSearchParams(window.location.hash.slice(1)).get('slide'));
      const next = Number.isInteger(value) && value > 0 ? Math.min(lecture.pages, value) : 1;
      setSlide(next);
      setDraft(String(next));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [lecture.pages]);
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
        url: lecture.file,
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
      });
      destroy = () => task.destroy();
      const pdf = await task.promise;
      if (!disposed) setDocument(pdf);
    };
    load().catch((reason) => {
      if (!disposed)
        setError(reason instanceof Error ? reason.message : 'The PDF could not be loaded.');
    });
    return () => {
      disposed = true;
      void destroy?.();
    };
  }, [lecture.file, retry]);
  return (
    <>
      <div className="page-heading lecture-heading">
        <h1>{lecture.title}</h1>
      </div>
      <div className="lecture-switcher">
        <label htmlFor="lecture-select">Lecture</label>
        <select
          id="lecture-select"
          value={lecture.id}
          onChange={(event) => router.push(`/lectures/${event.target.value}`)}
        >
          {lectures.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
        <a href={`${lecture.file}#page=${slide}`} target="_blank" rel="noreferrer">
          <ExternalLink size={15} /> Open PDF
        </a>
        <a href={lecture.file} download={lecture.sourceFile}>
          <Download size={15} /> Download
        </a>
      </div>
      <div className="lecture-demo-picker">
        <label htmlFor="lecture-demo">
          Lecture {index + 1} demos · selecting a demo opens its slide
        </label>
        <select
          id="lecture-demo"
          disabled={choices.length === 0}
          value={assignedDemo ?? ''}
          onChange={(event) => {
            const page = slideForDemo(lecture.id, event.target.value as ExperimentSlug);
            if (page !== undefined) goTo(page);
          }}
        >
          <option value="" disabled>
            {choices.length
              ? `No demo on slide ${slide} — choose a demo`
              : 'Repeated material — demos appear in the later lecture'}
          </option>
          {choices.map((slug) => (
            <option key={slug} value={slug}>
              {experiments.find((item) => item.slug === slug)?.title} · slide{' '}
              {slideForDemo(lecture.id, slug)}
            </option>
          ))}
        </select>
      </div>
      <div ref={studyLayout} className="lecture-study-layout">
        <section ref={reader} className="pdf-reader" aria-label={`${lecture.title} slide reader`}>
          <div className="pdf-toolbar">
            <button
              className="reader-icon-button"
              aria-label="Show slide index"
              aria-expanded={indexOpen}
              aria-controls="slide-index"
              onClick={() => setIndexOpen(!indexOpen)}
            >
              <List size={18} />
            </button>
            <div className="pdf-page-navigation">
              <button
                className="reader-icon-button"
                aria-label="Previous slide"
                disabled={slide <= 1}
                onClick={() => goTo(slide - 1)}
              >
                <ArrowLeft size={18} />
              </button>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  goTo(Number(draft));
                }}
              >
                <label htmlFor="slide-number">Slide</label>
                <input
                  id="slide-number"
                  type="number"
                  min={1}
                  max={pageCount}
                  step={1}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => {
                    if (draft.trim() && Number.isFinite(Number(draft))) goTo(Number(draft));
                    else setDraft(String(slide));
                  }}
                />
                <span>of {pageCount}</span>
              </form>
              <button
                className="reader-icon-button"
                aria-label="Next slide"
                disabled={slide >= pageCount}
                onClick={() => goTo(slide + 1)}
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="pdf-zoom">
              <button
                className="reader-icon-button"
                aria-label="Zoom out"
                disabled={zoom <= 0.75}
                onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
              >
                <Minus size={16} />
              </button>
              <button
                className="reader-fit"
                aria-label="Fit slide to width"
                onClick={() => setZoom(1)}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                className="reader-icon-button"
                aria-label="Zoom in"
                disabled={zoom >= 2}
                onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              type="button"
              className="reader-annotation-toggle"
              aria-pressed={showExplanations}
              onClick={() => setShowExplanations((visible) => !visible)}
            >
              {showExplanations ? 'Hide explanation dots' : 'Show explanation dots'}
            </button>
          </div>
          {indexOpen && (
            <div id="slide-index" className="slide-index" aria-label="Slides">
              {Array.from({ length: pageCount }, (_, offset) => (
                <button
                  key={offset}
                  aria-label={`Go to slide ${offset + 1}`}
                  aria-current={slide === offset + 1 ? 'page' : undefined}
                  onClick={() => goTo(offset + 1)}
                >
                  {offset + 1}
                </button>
              ))}
            </div>
          )}
          <div
            className="pdf-stage"
            style={{ aspectRatio: slideAspectRatio }}
            tabIndex={0}
            aria-label="Slide viewing area. Use left and right arrow keys to change slides."
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                goTo(slide + (event.key === 'ArrowRight' ? 1 : -1));
              } else if (event.key === 'Home' || event.key === 'End') {
                event.preventDefault();
                goTo(event.key === 'Home' ? 1 : pageCount);
              }
            }}
          >
            {error ? (
              <div className="pdf-load-error" role="alert">
                <h2>We couldn’t load these slides</h2>
                <p>{error}</p>
                <button className="reset-button" onClick={() => setRetry((value) => value + 1)}>
                  Try again
                </button>
                <a href={lecture.file} target="_blank" rel="noreferrer">
                  Open the original PDF →
                </a>
              </div>
            ) : document ? (
              <PdfSlide
                document={document}
                slide={slide}
                zoom={zoom}
                onAspectRatio={setSlideAspectRatio}
                explanation={explanation}
                showAnnotations={showExplanations}
              />
            ) : (
              <div className="pdf-loading" role="status">
                Loading lecture slides…
              </div>
            )}
          </div>
          <div className="pdf-reader-footer">
            <span aria-live="polite">
              Slide {slide} of {pageCount}
            </span>
            <span>Focus the slide and use ← / → to turn pages.</span>
          </div>
        </section>
        <section
          className="lecture-linked-demo"
          aria-label={assignedDemo ? 'Demo for this slide' : 'No demo for this slide'}
        >
          {assignedDemo && demo ? (
            <>
              <div className="lecture-demo-content">
                <div className="section-head">
                  <div>
                    <span className="eyebrow">{`DEMO FOR SLIDE ${slide}`}</span>
                    <h2>{demo.title}</h2>
                  </div>
                  <Link href={`/${assignedDemo}`}>Open full demo ↗</Link>
                </div>
                <ControlsHostContext.Provider value={controlsHost}>
                  <ExperimentView
                    key={`${lecture.id}-${assignedDemo}`}
                    slug={assignedDemo}
                    embedded
                  />
                </ControlsHostContext.Provider>
              </div>
              <div className="lecture-demo-controls" ref={setControlsHost} />
            </>
          ) : (
            <div className="lecture-empty-demo">
              <p>No demo on this slide.</p>
              <p>
                {explanation && showExplanations
                  ? 'Hover or select the blue dot on the slide to read its explanation.'
                  : explanation
                    ? 'Use “Show explanation dots” above the slide to read its explanation.'
                    : choices.length
                      ? 'Keep reading—a demo will appear when you reach a slide with one.'
                      : 'These introductory slides are repeated in Lecture 2, where their demos appear.'}
              </p>
            </div>
          )}
        </section>
      </div>
      <nav className="experiment-pagination" aria-label="Adjacent lectures">
        {[lectures[index - 1], lectures[index + 1]].map((item, offset) =>
          item ? (
            <Link key={item.id} href={`/lectures/${item.id}`}>
              <span>{offset === 0 ? '← Previous lecture' : 'Next lecture →'}</span>
              <strong>{item.title}</strong>
            </Link>
          ) : (
            <span key={offset} />
          ),
        )}
      </nav>
    </>
  );
}
