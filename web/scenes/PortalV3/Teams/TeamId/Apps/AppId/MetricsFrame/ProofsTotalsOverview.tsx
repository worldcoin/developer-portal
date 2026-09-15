import { type ProofsTotals } from "@/lib/proofs-analytics";

const countFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const formatCount = (value: number) => countFormatter.format(value);

const METRICS = [
  {
    key: "nUsersSharedProof",
    label: "Number of users who shared 1+ proof",
  },
  {
    key: "nProofsShared",
    label: "Number of proofs shared",
  },
] as const satisfies readonly {
  key: keyof ProofsTotals;
  label: string;
}[];

export const ProofsTotalsOverview = (props: { totals: ProofsTotals }) => (
  <section aria-label="Proofs overview" className="grid gap-4 sm:grid-cols-2">
    {METRICS.map((metric) => (
      <article
        key={metric.key}
        className="rounded-16 border border-portal-border bg-white p-5 sm:p-6"
      >
        <p className="font-world text-13 text-portal-muted">{metric.label}</p>
        <p className="mt-3 font-world text-24 leading-none font-medium tracking-[-0.01em] text-portal-heading tabular-nums">
          {formatCount(props.totals[metric.key])}
        </p>
      </article>
    ))}
  </section>
);
