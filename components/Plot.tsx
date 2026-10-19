'use client';

import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { useState } from 'react';

export type Series = { name: string; color: string; points: [number, number][]; dash?: boolean };
type Marker = { x: number; label: string };
type Zone = { from: number; to: number; color: string };

export default function Plot({ title, series, xLabel = 'Position (µm)', yLabel = '', xDomain, yDomain, markers = [], zones = [], height = 310, onInspect }: {
  title: string;
  series: Series[];
  xLabel?: string;
  yLabel?: string;
  xDomain: [number, number];
  yDomain: [number, number];
  markers?: Marker[];
  zones?: Zone[];
  height?: number;
  onInspect?: (x: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 640, h = height, left = 68, right = 18, top = 22, bottom = 42;
  const X = scaleLinear().domain(xDomain).range([left, w - right]);
  const Y = scaleLinear().domain(yDomain).range([h - bottom, top]);
  const makeLine = line<[number, number]>().x(d => X(d[0])).y(d => Y(d[1]));
  const yTicks = Y.ticks(5);
  const xTicks = X.ticks(6);
  const tickLabel = (value: number) => Math.abs(value) >= 1000 ? value.toExponential(0) : Number(value.toPrecision(2));

  return <div className="plot-card">
    <div className="plot-title"><b>{title}</b><span>{yLabel}</span></div>
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={title}
      onMouseMove={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = X.invert((event.clientX - bounds.left) * w / bounds.width);
        setHover(Math.max(xDomain[0], Math.min(xDomain[1], x)));
      }}
      onMouseLeave={() => setHover(null)}>
      {zones.map((zone, index) => <rect key={index} x={X(zone.from)} y={top} width={Math.max(0, X(zone.to) - X(zone.from))} height={h - top - bottom} fill={zone.color} opacity=".065" />)}
      {yTicks.map(value => <g key={value}>
        <line x1={left} x2={w - right} y1={Y(value)} y2={Y(value)} stroke="#e8ecef" />
        <text x={left - 10} y={Y(value) + 4} textAnchor="end" fill="#7c8994" fontSize="11">{tickLabel(value)}</text>
      </g>)}
      {xTicks.map(value => <g key={value}>
        <line x1={X(value)} x2={X(value)} y1={top} y2={h - bottom} stroke="#f0f2f4" />
        <text x={X(value)} y={h - bottom + 19} textAnchor="middle" fill="#7c8994" fontSize="11">{tickLabel(value)}</text>
      </g>)}
      <line x1={left} x2={w - right} y1={h - bottom} y2={h - bottom} stroke="#a9b3bb" />
      <line x1={left} x2={left} y1={top} y2={h - bottom} stroke="#a9b3bb" />
      {series.map(item => <path key={item.name} d={makeLine(item.points) || ''} fill="none" stroke={item.color} strokeWidth="2.5" strokeDasharray={item.dash ? '6 5' : undefined} vectorEffect="non-scaling-stroke" />)}
      {markers.filter(marker => marker.x >= xDomain[0] && marker.x <= xDomain[1]).map((marker, index) => <g key={index}>
        <line x1={X(marker.x)} x2={X(marker.x)} y1={top} y2={h - bottom} stroke="#9b6c2b" strokeDasharray="4 4" />
        <text x={Math.min(X(marker.x) + 5, w - 112)} y={top + 13} fill="#8c6023" fontSize="11">{marker.label}</text>
      </g>)}
      {hover !== null && <line x1={X(hover)} x2={X(hover)} y1={top} y2={h - bottom} stroke="#657381" strokeDasharray="3 3" />}
      <text x={(left + w - right) / 2} y={h - 5} textAnchor="middle" fill="#84919b" fontSize="11">{xLabel}</text>
    </svg>
    <div className="plot-footer">
      <div className="legend">{series.map(item => <span key={item.name}><i style={{ background: item.color }} />{item.name}</span>)}</div>
      <span className="inspect">{hover === null ? 'Hover to inspect' : onInspect ? onInspect(hover) : `x = ${hover.toFixed(3)} µm`}</span>
    </div>
  </div>;
}
