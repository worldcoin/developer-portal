import { type TotalsRow } from "@/lib/selfie-check-analytics";

const OVERVIEW_METRICS = [
  {
    key: "n_users_started_at_least_one_selfie_check_flow",
    label: "Number of users who started 1+ Selfie Check flow",
  },
  {
    key: "n_users_shared_at_least_one_proof",
    label: "Number of users who shared 1+ Selfie Check proof",
  },
] as const satisfies readonly {
  key: keyof Omit<TotalsRow, "appId">;
  label: string;
}[];

const countFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const formatCount = (value: number | null) =>
  typeof value === "number" ? countFormatter.format(value) : "—";

/** Lifetime unique users, ordered to match the conversion funnel. */
export const TotalsOverview = (props: { row: TotalsRow }) => (
  <section
    aria-label="Analytics overview"
    className="grid gap-4 sm:grid-cols-2"
  >
    {OVERVIEW_METRICS.map((metric) => (
      <article
        key={metric.key}
        className="rounded-16 border border-portal-border bg-white p-5 sm:p-6"
      >
        <p className="font-world text-13 text-portal-muted">{metric.label}</p>
        <p className="mt-3 font-world text-24 leading-none font-medium tracking-[-0.01em] text-portal-heading tabular-nums">
          {formatCount(props.row[metric.key])}
        </p>
      </article>
    ))}
  </section>
);
