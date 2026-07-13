"use client";

import { useCallback, useState } from "react";

type SparklineProps = {
  points: number[];
  labels?: string[];
  className?: string;
  ariaLabel?: string;
};

const VIEW_W = 240;
const VIEW_H = 56;
const PAD = 3;

export const Sparkline = ({
  points,
  labels,
  className,
  ariaLabel,
}: SparklineProps) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const interactive = Boolean(labels?.length);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive || points.length < 2) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const fraction = (event.clientX - rect.left) / rect.width;
      const idx = Math.round(fraction * (points.length - 1));
      setHoverIdx(Math.max(0, Math.min(points.length - 1, idx)));
    },
    [interactive, points.length],
  );

  if (points.length === 0) {
    return null;
  }

  const max = Math.max(...points, 1);
  const stepX =
    points.length > 1 ? (VIEW_W - PAD * 2) / (points.length - 1) : 0;

  const coords = points.map((value, i) => {
    const x = PAD + i * stepX;
    const y = VIEW_H - PAD - (value / max) * (VIEW_H - PAD * 2);
    return { x, y };
  });

  const polyline = coords
    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const hover = hoverIdx !== null ? hoverIdx : null;
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
    <div
      className={`relative ${className ?? ""}`}
      onMouseMove={interactive ? handleMouseMove : undefined}
      onMouseLeave={interactive ? () => setHoverIdx(null) : undefined}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="size-full"
        role="img"
        aria-label={ariaLabel}
      >
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
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
              {points[hover].toLocaleString()}{" "}
              {points[hover] === 1 ? "verification" : "verifications"}
            </span>
            <span className="font-world text-12 text-portal-muted">
              {labels?.[hover]}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
};
