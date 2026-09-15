type TooltipEntry = Readonly<{
  color: string;
  name: string;
}>;

type TooltipPayloadEntry = Readonly<{
  name?: unknown;
  value?: unknown;
}>;

/** A compact stacked-chart tooltip that includes the visible-series total. */
export const StackedMetricTooltip = (props: {
  active?: boolean;
  formatLabel: (value: string) => string;
  formatValue: (value: number) => string;
  label?: unknown;
  payload?: readonly TooltipPayloadEntry[];
  series: readonly TooltipEntry[];
}) => {
  if (!props.active || !props.payload?.length) return null;

  const entries = props.series.flatMap((series) => {
    const value = props.payload?.find(
      (item) => item.name === series.name,
    )?.value;
    return typeof value === "number" ? [{ ...series, value }] : ([] as const);
  });
  if (!entries.length) return null;

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="min-w-36 rounded-12 border border-portal-border bg-white px-4 py-3 font-world text-12 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <p className="mb-2 font-medium text-portal-heading">
        {props.formatLabel(String(props.label ?? ""))}
      </p>
      <ul className="space-y-1.5">
        {entries.map((entry) => (
          <li
            key={entry.name}
            className="flex items-center justify-between gap-5"
          >
            <span className="flex items-center gap-1.5 text-portal-muted">
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="text-portal-heading tabular-nums">
              {props.formatValue(entry.value)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between gap-5 border-t border-portal-border pt-2 font-medium text-portal-heading">
        <span>Total</span>
        <span className="tabular-nums">{props.formatValue(total)}</span>
      </div>
    </div>
  );
};
