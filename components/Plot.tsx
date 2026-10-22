'use client';

import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useId, useState } from 'react';
import { useChangeHighlight } from './useChangeHighlight';

export type Series = {
  name: string;
  color: string;
  points: [number, number][];
  dash?: boolean;
  areaTo?: number;
};
type Marker = { x: number; label: string };
type Zone = { from: number; to: number; color: string };
export type EnergyBracket = {
  x: number;
  from: number;
  to: number;
  label: string;
  color?: string;
  dashed?: boolean;
  guideFromX?: number;
  guideToX?: number;
  side?: 'left' | 'right';
  labelDy?: number;
};
export type PointLabel = {
  x: number;
  y: number;
  label: string;
  color?: string;
  dx?: number;
  dy?: number;
};
export type SpanLabel = { from: number; to: number; y: number; label: string; color?: string };

type PlacedLabel = {
  key: string;
  label: string;
  x: number;
  y: number;
  width: number;
  anchorX: number;
  anchorY: number;
  color: string;
};

function MeasurementLabel({ label }: { label: PlacedLabel }) {
  const highlighted = useChangeHighlight(label.label);
  return (
    <g fill={label.color} stroke={label.color}>
      <line
        x1={label.anchorX}
        y1={label.anchorY}
        x2={Math.max(label.x, Math.min(label.anchorX, label.x + label.width))}
        y2={label.y - 5}
        strokeWidth="1"
      />
      <text
        className={highlighted && /\d/.test(label.label) ? 'plot-number-updated' : undefined}
        x={label.x}
        y={label.y}
        fontSize="11"
        fontWeight="700"
        stroke="white"
        strokeWidth="3"
        paintOrder="stroke"
      >
        {label.label}
      </text>
    </g>
  );
}

export default function Plot({
  title,
  series,
  xLabel = 'Position (µm)',
  yLabel = '',
  xDomain,
  yDomain,
  markers = [],
  zones = [],
  brackets = [],
  points = [],
  spans = [],
  height = 260,
  onInspect,
}: {
  title: string;
  series: Series[];
  xLabel?: string;
  yLabel?: string;
  xDomain: [number, number];
  yDomain: [number, number];
  markers?: Marker[];
  zones?: Zone[];
  brackets?: EnergyBracket[];
  points?: PointLabel[];
  spans?: SpanLabel[];
  height?: number;
  onInspect?: (x: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();
  const clamp = (x: number) => Math.max(xDomain[0], Math.min(xDomain[1], x));
  const visible = (x: number, y: number) =>
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= xDomain[0] &&
    x <= xDomain[1] &&
    y >= yDomain[0] &&
    y <= yDomain[1];
  points = points.filter((p) => visible(p.x, p.y));
  spans = spans.filter((p) => visible((p.from + p.to) / 2, p.y));
  brackets = brackets.filter((p) => visible(p.x, (p.from + p.to) / 2));
  const w = 640,
    h = height,
    left = 68,
    right = 18,
    top = 22,
    bottom = 42;
  const X = scaleLinear()
    .domain(xDomain)
    .range([left, w - right]);
  const Y = scaleLinear()
    .domain(yDomain)
    .range([h - bottom, top]);
  const makeLine = line<[number, number]>()
    .defined((d) => d.every(Number.isFinite))
    .x((d) => X(d[0]))
    .y((d) => Y(d[1]));
  const yTicks = Y.ticks(5);
  const xTicks = X.ticks(6);
  const tickLabel = (value: number) =>
    Math.abs(value) >= 1000
      ? Number(value.toPrecision(3)).toExponential()
      : Number(value.toPrecision(3));
  const labelSeeds = [
    ...markers
      .filter((marker) => marker.x >= xDomain[0] && marker.x <= xDomain[1])
      .map((marker, index) => ({
        key: `marker-${index}`,
        label: marker.label,
        anchorX: X(marker.x),
        anchorY: top + 8,
        preferredX: X(marker.x) + 8,
        preferredY: top + 14,
        color: '#8c6023',
      })),
    ...spans.map((span, index) => ({
      key: `span-${index}`,
      label: span.label,
      anchorX: (X(span.from) + X(span.to)) / 2,
      anchorY: Y(span.y),
      preferredX: (X(span.from) + X(span.to)) / 2 - span.label.length * 3.1,
      preferredY: Y(span.y) - 9,
      color: span.color ?? '#446a77',
    })),
    ...brackets.map((bracket, index) => ({
      key: `bracket-${index}`,
      label: bracket.label,
      anchorX: X(bracket.x),
      anchorY: (Y(bracket.from) + Y(bracket.to)) / 2,
      preferredX: X(bracket.x) + (bracket.side === 'left' ? -bracket.label.length * 6.2 - 9 : 9),
      preferredY: (Y(bracket.from) + Y(bracket.to)) / 2 + (bracket.labelDy ?? 0) + 3,
      color: bracket.color ?? '#6e4ba3',
    })),
    ...points.map((point, index) => ({
      key: `point-${index}`,
      label: point.label,
      anchorX: X(point.x),
      anchorY: Y(point.y),
      preferredX:
        X(point.x) + (point.dx ?? 10) + ((point.dx ?? 10) < 0 ? -point.label.length * 6.2 : 3),
      preferredY: Y(point.y) + (point.dy ?? -10) - 3,
      color: point.color ?? '#345e6b',
    })),
  ];
  const placed: PlacedLabel[] = [];
  for (const seed of labelSeeds) {
    const width = Math.min(230, seed.label.length * 6.2 + 5);
    const candidates = [0, -17, 17, -34, 34, -51, 51, -68, 68];
    let best: { x: number; y: number; penalty: number } | null = null;
    for (const dy of candidates) {
      for (const dx of [0, -24, 24, -72, 72, -130, 130]) {
        const x = Math.max(left + 4, Math.min(w - right - width - 3, seed.preferredX + dx));
        const y = Math.max(top + 12, Math.min(h - bottom - 4, seed.preferredY + dy));
        const overlaps = placed.filter(
          (other) =>
            x < other.x + other.width + 5 &&
            x + width + 5 > other.x &&
            y - 13 < other.y + 4 &&
            y + 4 > other.y - 13,
        ).length;
        const penalty = overlaps * 10000 + Math.abs(dx) + Math.abs(dy) * 1.4;
        if (!best || penalty < best.penalty) best = { x, y, penalty };
      }
    }
    placed.push({ ...seed, x: best!.x, y: best!.y, width });
  }

  return (
    <div className="plot-card">
      <div className="plot-title">
        <b>{title}</b>
        <span>{yLabel}</span>
      </div>
      <div className="plot-visual">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={`${title}. Use left and right arrow keys to inspect.`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
            event.preventDefault();
            if (event.key === 'Escape') {
              setHover(null);
              return;
            }
            setHover(
              event.key === 'Home'
                ? xDomain[0]
                : event.key === 'End'
                  ? xDomain[1]
                  : clamp(
                      (hover ?? (xDomain[0] + xDomain[1]) / 2) +
                        ((event.key === 'ArrowLeft' ? -1 : 1) * (xDomain[1] - xDomain[0])) / 100,
                    ),
            );
          }}
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = X.invert(((event.clientX - bounds.left) * w) / bounds.width);
            setHover(Math.max(xDomain[0], Math.min(xDomain[1], x)));
          }}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={left} y={top} width={w - left - right} height={h - top - bottom} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            {zones.map((zone, index) => (
              <rect
                key={index}
                x={X(zone.from)}
                y={top}
                width={Math.max(0, X(zone.to) - X(zone.from))}
                height={h - top - bottom}
                fill={zone.color}
                opacity=".065"
              />
            ))}
          </g>
          {yTicks.map((value) => (
            <g key={value}>
              <line x1={left} x2={w - right} y1={Y(value)} y2={Y(value)} stroke="#e8ecef" />
              <text x={left - 10} y={Y(value) + 4} textAnchor="end" fill="#7c8994" fontSize="11">
                {tickLabel(value)}
              </text>
            </g>
          ))}
          {xTicks.map((value) => (
            <g key={value}>
              <line x1={X(value)} x2={X(value)} y1={top} y2={h - bottom} stroke="#f0f2f4" />
              <text
                x={X(value)}
                y={h - bottom + 19}
                textAnchor="middle"
                fill="#7c8994"
                fontSize="11"
              >
                {tickLabel(value)}
              </text>
            </g>
          ))}
          <line x1={left} x2={w - right} y1={h - bottom} y2={h - bottom} stroke="#a9b3bb" />
          <line x1={left} x2={left} y1={top} y2={h - bottom} stroke="#a9b3bb" />
          <g clipPath={`url(#${clipId})`}>
            {series.map((item) => (
              <g key={item.name}>
                {item.areaTo !== undefined && item.points.length > 1 && (
                  <path
                    d={
                      makeLine([
                        ...item.points,
                        [item.points[item.points.length - 1][0], item.areaTo],
                        [item.points[0][0], item.areaTo],
                      ]) || ''
                    }
                    fill={item.color}
                    fillOpacity=".14"
                    stroke="none"
                  />
                )}
                <path
                  d={makeLine(item.points) || ''}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="2.5"
                  strokeDasharray={item.dash ? '6 5' : undefined}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
            {spans.map((span, index) => {
              const y = Y(span.y),
                x1 = X(span.from),
                x2 = X(span.to),
                color = span.color ?? '#446a77';
              return (
                <g key={`span-${index}`} stroke={color} fill={color}>
                  <line x1={x1} x2={x2} y1={y} y2={y} strokeWidth="1.6" />
                  <line x1={x1} x2={x1} y1={y - 5} y2={y + 5} strokeWidth="1.6" />
                  <line x1={x2} x2={x2} y1={y - 5} y2={y + 5} strokeWidth="1.6" />
                </g>
              );
            })}
            {brackets.map((bracket, index) => {
              const x = X(bracket.x),
                upper = Y(Math.max(bracket.from, bracket.to)),
                lower = Y(Math.min(bracket.from, bracket.to));
              const color = bracket.color ?? '#6e4ba3';
              return (
                <g key={`bracket-${index}`} stroke={color} fill={color}>
                  {bracket.guideFromX !== undefined && (
                    <line
                      x1={x}
                      x2={X(bracket.guideFromX)}
                      y1={Y(bracket.from)}
                      y2={Y(bracket.from)}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )}
                  {bracket.guideToX !== undefined && (
                    <line
                      x1={x}
                      x2={X(bracket.guideToX)}
                      y1={Y(bracket.to)}
                      y2={Y(bracket.to)}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )}
                  <line
                    x1={x}
                    x2={x}
                    y1={upper}
                    y2={lower}
                    strokeWidth="2"
                    strokeDasharray={bracket.dashed ? '4 3' : undefined}
                  />
                  <line
                    x1={x - 5}
                    x2={x + 5}
                    y1={upper}
                    y2={upper}
                    stroke={color}
                    strokeWidth="2"
                  />
                  <line
                    x1={x - 5}
                    x2={x + 5}
                    y1={lower}
                    y2={lower}
                    stroke={color}
                    strokeWidth="2"
                  />
                </g>
              );
            })}
            {points.map((point, index) => {
              const x = X(point.x),
                y = Y(point.y),
                color = point.color ?? '#345e6b';
              return (
                <g key={`point-${index}`} stroke={color} fill={color}>
                  <circle cx={x} cy={y} r="3.5" fill="white" strokeWidth="2" />
                </g>
              );
            })}
            {markers
              .filter((marker) => marker.x >= xDomain[0] && marker.x <= xDomain[1])
              .map((marker, index) => (
                <g key={index}>
                  <line
                    x1={X(marker.x)}
                    x2={X(marker.x)}
                    y1={top}
                    y2={h - bottom}
                    stroke="#9b6c2b"
                    strokeDasharray="4 4"
                  />
                </g>
              ))}
          </g>
          {placed.map((label) => (
            <MeasurementLabel key={label.key} label={label} />
          ))}
          {hover !== null && (
            <line
              x1={X(clamp(hover))}
              x2={X(clamp(hover))}
              y1={top}
              y2={h - bottom}
              stroke="#657381"
              strokeDasharray="3 3"
            />
          )}
          <text
            x={(left + w - right) / 2}
            y={h - 5}
            textAnchor="middle"
            fill="#84919b"
            fontSize="11"
          >
            {xLabel}
          </text>
        </svg>
      </div>
      <div className="plot-footer">
        <div className="legend">
          {series.map((item) => (
            <span key={item.name}>
              <i style={{ background: item.color }} />
              {item.name}
            </span>
          ))}
        </div>
        <span className="inspect">
          {hover === null
            ? 'Hover, touch, or use arrow keys to inspect'
            : onInspect
              ? onInspect(clamp(hover))
              : `x = ${clamp(hover).toPrecision(4)}`}
        </span>
      </div>
    </div>
  );
}
