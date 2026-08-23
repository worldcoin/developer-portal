"use client";

import { useCallback, useState } from "react";

const VIEW_W = 240;
const VIEW_H = 56;
const PAD = 3;

export type SparklinePoint = {
  count: string;
  label?: string;
};

/**
 * Uniform-stroke sparkline with the archived hover treatment: a dashed
 * vertical rule plus a count/date popup. Interactive only when points carry
 * labels; card previews pass bare counts and stay static.
 */
export const Sparkline = (props: {
  points: SparklinePoint[];
  ariaLabel: string;
  className?: string;
}) => {
  const { points } = props;
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const interactive = points.some((point) => point.label);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!interactive || points.length === 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const fraction = rect.width
        ? (event.clientX - rect.left) / rect.width
        : 0;
      const index = Math.round(fraction * (points.length - 1));
      setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
    },
    [interactive, points.length],
  );

  const values = points.map((point) => Number(point.count));
  const max = Math.max(...values, 1);
  const stepX =
    points.length > 1 ? (VIEW_W - PAD * 2) / (points.length - 1) : 0;
  const yFor = (value: number) =>
    VIEW_H - PAD - (value / max) * (VIEW_H - PAD * 2);
  // Hover anchors: a lone point sits mid-width so its popup centers.
  const coords = values.map((value, index) => ({
    x: points.length > 1 ? PAD + index * stepX : VIEW_W / 2,
    y: yFor(value),
  }));
  // A one-vertex polyline paints nothing, so a new entity (or an empty
  // scope) would render a blank box instead of the contracted flat graph.
  // Span those across the full width at their own height.
  const line =
    coords.length > 1
      ? coords
      : [
          { x: PAD, y: yFor(values[0] ?? 0) },
          { x: VIEW_W - PAD, y: yFor(values[0] ?? 0) },
        ];
  const polyline = line
    .map((coord) => `${coord.x.toFixed(1)},${coord.y.toFixed(1)}`)
    .join(" ");
  const flatZero = points.every((point) => point.count === "0");

  const hover = hoverIndex;
  const hoverLeftPct = hover !== null ? (coords[hover].x / VIEW_W) * 100 : 0;
  const tooltipShift =
    hover === null
      ? "-50%"
      : hover === 0
        ? "-10%"
        : hover === points.length - 1
          ? "-90%"
          : "-50%";

  return (
    <div className={`relative ${props.className ?? ""}`}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="size-full"
        role="img"
        aria-label={props.ariaLabel}
        onMouseMove={interactive ? handleMouseMove : undefined}
        onMouseLeave={interactive ? () => setHoverIndex(null) : undefined}
      >
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          data-flat-zero={flatZero ? "true" : undefined}
        />
      </svg>

      {interactive && hover !== null ? (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 border-l border-dashed border-portal-subtle"
            style={{ left: `${hoverLeftPct}%` }}
          />
          <div
            className="pointer-events-none absolute bottom-full z-20 mb-2 flex flex-col gap-0.5 rounded-8 border border-portal-border bg-white px-2.5 py-1.5 whitespace-nowrap shadow-portal-card"
            style={{
              left: `${hoverLeftPct}%`,
              transform: `translateX(${tooltipShift})`,
            }}
          >
            <span className="font-world text-13 font-medium text-portal-heading">
              {Number(points[hover].count).toLocaleString()}{" "}
              {points[hover].count === "1" ? "verification" : "verifications"}
            </span>
            <span className="font-world text-12 text-portal-muted">
              {points[hover].label}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
};
