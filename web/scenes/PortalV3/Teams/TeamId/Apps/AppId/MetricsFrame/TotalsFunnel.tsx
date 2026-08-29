"use client";

import { type TotalsRow } from "@/lib/selfie-check-analytics";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

/** Conversion stages, in order, computed from the totals row. */
const FUNNEL_STAGES = [
  { key: "n_face_auth_started_sessions", label: "Face auth started" },
  { key: "n_face_auth_completed_sessions", label: "Face auth completed" },
  { key: "n_proofs", label: "Proofs shared" },
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

type FunnelDatum = {
  name: string;
  value: number;
  conversion: string | null;
};

const FunnelTooltip = (props: {
  active?: boolean;
  payload?: readonly { payload?: FunnelDatum }[];
}) => {
  const datum = props.payload?.[0]?.payload;
  if (!props.active || !datum) return null;

  return (
    <div className="rounded-8 border border-portal-border bg-white px-3 py-2 shadow-portal-card">
      <p className="font-world text-12 text-portal-muted">{datum.name}</p>
      <p className="font-world text-13 font-medium text-portal-heading">
        {countFormatter.format(datum.value)}
      </p>
      {datum.conversion && (
        <p className="font-world text-12 text-portal-subtle">
          {datum.conversion}
        </p>
      )}
    </div>
  );
};

export const TotalsFunnel = (props: { row: TotalsRow }) => {
  const values = FUNNEL_STAGES.map((stage) => props.row[stage.key]);
  const data: FunnelDatum[] = FUNNEL_STAGES.map((stage, index) => ({
    name: stage.label,
    value: values[index] ?? 0,
    conversion: index === 0 ? null : conversionFromPrevious(values, index),
  }));

  return (
    <section
      aria-label="Selfie check funnel"
      className="w-full rounded-[10px] border border-portal-border bg-white p-5 shadow-portal-card"
    >
      <h3 className="font-world text-14 font-medium text-portal-heading">
        Selfie Check - Funnel
      </h3>

      <div className="mt-4 grid grid-cols-3">
        {FUNNEL_STAGES.map((stage, index) => (
          <div
            key={stage.key}
            className={
              index > 0 ? "border-l border-portal-border pl-4" : undefined
            }
          >
            <p className="font-world text-13 text-portal-muted">
              {stage.label}
            </p>
            <p className="mt-1 font-world text-24 leading-none font-medium text-portal-heading">
              {formatCount(values[index])}
            </p>
            <p className="mt-1 font-world text-12 text-portal-subtle">
              {index === 0 ? " " : conversionFromPrevious(values, index) ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 h-[180px] w-full [&_.recharts-surface]:outline-none [&_.recharts-wrapper]:outline-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 4, left: 8 }}
            barCategoryGap="18%"
          >
            <XAxis dataKey="name" hide />
            <Tooltip
              content={<FunnelTooltip />}
              isAnimationActive={false}
              cursor={{ fill: "rgba(24, 24, 24, 0.04)" }}
            />
            <Bar
              dataKey="value"
              isAnimationActive={false}
              radius={[3, 3, 0, 0]}
            >
              {data.map((datum, index) => (
                <Cell key={datum.name} fill={FUNNEL_COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
