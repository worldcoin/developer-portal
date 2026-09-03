"use client";

import { type TotalsRow } from "@/lib/selfie-check-analytics";
import { useState } from "react";
import { CompletionRing } from "./CompletionRing";

/** Conversion stages, left to right, computed from the totals row. */
const FUNNEL_STAGES = [
  { key: "n_face_capture_started_sessions", label: "Face Capture started" },
  {
    key: "n_face_capture_completed_sessions",
    label: "Face Capture completed",
  },
  { key: "n_proof_shared_sessions", label: "Proofs shared" },
] as const satisfies readonly {
  key: keyof Omit<TotalsRow, "appId">;
  label: string;
}[];

// Sequential single-hue steps (light -> dark portal blue) down the funnel.
const FUNNEL_COLORS = ["#8ec2ff", "#3d9aff", "#007cfb"] as const;

const countFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});
const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatCount = (value: number | null) =>
  typeof value === "number" ? countFormatter.format(value) : "—";

const conversionFromPrevious = (
  values: readonly (number | null)[],
  index: number,
) => {
  const previous = values[index - 1];
  const current = values[index];
  if (typeof previous !== "number" || previous <= 0) return null;
  if (typeof current !== "number") return null;
  return `${percentFormatter.format(current / previous)} of previous`;
};

// Funnel geometry in viewBox units: three 100-wide stages centered on y=50.
// Stage one is a rectangle; each later stage eases from the previous
// thickness into its own over the neck, then holds flat.
const STAGE_WIDTH = 100;
const MID_Y = 50;
const MAX_HALF_THICKNESS = 44;
const NECK_WIDTH = 26;
const SEAM = 1;

const halfThickness = (value: number | null, max: number) => {
  if (typeof value !== "number" || value <= 0 || max <= 0) return 0;
  return Math.max((value / max) * MAX_HALF_THICKNESS, 2);
};

const stagePath = (index: number, halves: readonly number[]) => {
  const h = halves[index];
  const start = index * STAGE_WIDTH + (index === 0 ? 0 : SEAM);
  const end =
    (index + 1) * STAGE_WIDTH - (index === FUNNEL_STAGES.length - 1 ? 0 : SEAM);

  if (index === 0) {
    return [
      `M ${start},${MID_Y - h}`,
      `H ${end}`,
      `V ${MID_Y + h}`,
      `H ${start}`,
      "Z",
    ].join(" ");
  }

  const previous = halves[index - 1];
  const neckEnd = start + NECK_WIDTH;
  const control = start + NECK_WIDTH / 2;

  return [
    `M ${start},${MID_Y - previous}`,
    `C ${control},${MID_Y - previous} ${control},${MID_Y - h} ${neckEnd},${MID_Y - h}`,
    `H ${end}`,
    `V ${MID_Y + h}`,
    `H ${neckEnd}`,
    `C ${control},${MID_Y + h} ${control},${MID_Y + previous} ${start},${MID_Y + previous}`,
    "Z",
  ].join(" ");
};

type Hover = { index: number; x: number; y: number };

export const TotalsFunnel = (props: { row: TotalsRow }) => {
  const [hover, setHover] = useState<Hover | null>(null);

  const values = FUNNEL_STAGES.map((stage) => props.row[stage.key]);
  const max = Math.max(...values.map((value) => value ?? 0));
  const halves = values.map((value) => halfThickness(value, max));

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const index = Math.min(
      FUNNEL_STAGES.length - 1,
      Math.max(0, Math.floor((x / bounds.width) * FUNNEL_STAGES.length)),
    );
    setHover({ index, x, y });
  };

  return (
    <section
      aria-label="Selfie Check funnel"
      className="w-full rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
    >
      <div className="grid grid-cols-3">
        {FUNNEL_STAGES.map((stage, index) => (
          <div
            key={stage.key}
            className={
              index === 0
                ? "pr-4"
                : index === FUNNEL_STAGES.length - 1
                  ? "border-l border-portal-border pl-4"
                  : "border-l border-portal-border px-4"
            }
          >
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-world text-13 text-portal-muted">
                  {stage.label}
                </p>
                <p className="mt-1 font-world text-24 leading-none font-medium text-portal-heading">
                  {formatCount(values[index])}
                </p>
              </div>
              {index === 1 && (
                <CompletionRing
                  value={
                    props.row.p_face_capture_started_to_completed_completion
                  }
                />
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        className="relative mt-3 h-[160px] w-full"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <svg
          aria-hidden
          viewBox={`0 0 ${FUNNEL_STAGES.length * STAGE_WIDTH} 100`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {FUNNEL_STAGES.map((stage, index) => (
            <path
              key={stage.key}
              d={stagePath(index, halves)}
              fill={FUNNEL_COLORS[index]}
            />
          ))}
          {hover && (
            <rect
              x={hover.index * STAGE_WIDTH}
              y={0}
              width={STAGE_WIDTH}
              height={100}
              fill="rgba(24, 24, 24, 0.05)"
            />
          )}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-8 border border-portal-border bg-white px-3 py-2 shadow-portal-card"
            style={{
              left: hover.x,
              top: hover.y,
              transform: "translate(calc(-100% - 12px), 12px)",
            }}
          >
            <p className="font-world text-12 whitespace-nowrap text-portal-muted">
              {FUNNEL_STAGES[hover.index].label}
            </p>
            <p className="font-world text-13 font-medium text-portal-heading">
              {formatCount(values[hover.index])}
            </p>
            {hover.index > 0 && conversionFromPrevious(values, hover.index) && (
              <p className="font-world text-12 whitespace-nowrap text-portal-subtle">
                {conversionFromPrevious(values, hover.index)}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
