const RING_SIZE = 56;
const RING_STROKE = 5;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Compact progress treatment for the funnel's completion rate. */
export const CompletionRing = (props: { value: number | null }) => {
  // The analytics contract supplies a normalized rate (0.94 means 94%).
  // Clamp defensively before using it in either the SVG or ARIA percentage.
  const completion =
    typeof props.value === "number"
      ? Math.min(Math.max(props.value, 0), 1)
      : null;
  const percentage =
    completion === null ? null : Number((completion * 100).toFixed(1));
  const formatted =
    completion === null ? "—" : percentFormatter.format(completion);

  return (
    <div className="grid shrink-0 justify-items-center gap-1.5">
      <div
        aria-label={
          completion === null
            ? "Face capture completion unavailable"
            : "Face capture completion"
        }
        aria-valuemax={completion === null ? undefined : 100}
        aria-valuemin={completion === null ? undefined : 0}
        aria-valuenow={percentage ?? undefined}
        aria-valuetext={
          completion === null
            ? undefined
            : `${formatted} of face capture sessions completed`
        }
        className="relative size-14"
        role={completion === null ? "img" : "progressbar"}
      >
        <svg
          aria-hidden
          className="size-full"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        >
          <circle
            className="fill-none stroke-portal-border"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            strokeWidth={RING_STROKE}
          />
          {completion !== null && (
            <circle
              className="fill-none stroke-portal-blue"
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - completion)}
              strokeLinecap="round"
              strokeWidth={RING_STROKE}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-world text-11 font-medium text-portal-heading tabular-nums">
          {formatted}
        </span>
      </div>
      <span className="font-world text-11 whitespace-nowrap text-portal-muted">
        Completion rate
      </span>
    </div>
  );
};
