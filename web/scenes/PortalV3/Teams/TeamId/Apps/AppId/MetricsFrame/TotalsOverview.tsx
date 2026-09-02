import { type TotalsRow } from "@/lib/selfie-check-analytics";

const OVERVIEW_METRICS = [
  {
    key: "n_proof_users",
    label: "Proof users",
  },
  {
    key: "n_users_started_selfie_check_flow",
    label: "Users who started Selfie Check",
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

/** All-time app totals shown before the funnel and daily charts. */
export const TotalsOverview = (props: { row: TotalsRow }) => (
  <section
    aria-label="Analytics overview"
    className="grid overflow-hidden rounded-[10px] border border-portal-border bg-white shadow-portal-card sm:grid-cols-2"
  >
    {OVERVIEW_METRICS.map((metric, index) => (
      <article
        key={metric.key}
        className={
          index > 0
            ? "border-t border-portal-border p-5 sm:border-t-0 sm:border-l"
            : "p-5"
        }
      >
        <p className="font-world text-13 text-portal-muted">{metric.label}</p>
        <p className="mt-3 font-world text-24 leading-none font-medium tracking-[-0.01em] text-portal-heading tabular-nums">
          {formatCount(props.row[metric.key])}
        </p>
      </article>
    ))}
  </section>
);
