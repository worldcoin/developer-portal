"use client";

import Skeleton from "react-loading-skeleton";
import { Sparkline } from "../Sparkline";

export type TrendSparklineState =
  | { status: "loading" }
  | { status: "error"; onRetry: () => void }
  | { status: "ready"; points: number[]; labels: string[] };

const variants = {
  hero: {
    wrapper: "min-h-16",
    sparkline: "h-14 w-full text-portal-heading sm:w-[240px]",
    skeleton: { width: 240, height: 56 },
  },
  detail: {
    wrapper: "min-h-[52px]",
    sparkline: "h-[52px] w-[200px] text-portal-heading",
    skeleton: { width: 200, height: 52 },
  },
} as const;

export const TrendSparkline = (props: {
  state: TrendSparklineState;
  rangeLabel: string;
  variant: keyof typeof variants;
}) => {
  const variant = variants[props.variant];

  return (
    <div
      className={`flex ${variant.wrapper} flex-col items-end justify-end gap-1`}
      aria-busy={props.state.status === "loading"}
      aria-live="polite"
    >
      {props.state.status === "loading" ? (
        <Skeleton {...variant.skeleton} />
      ) : props.state.status === "error" ? (
        <div className="flex h-[52px] items-center gap-2 font-world text-12 text-portal-muted">
          <span>Trend unavailable.</span>
          <button
            type="button"
            className="underline hover:text-portal-ink"
            onClick={props.state.onRetry}
          >
            Try again
          </button>
        </div>
      ) : (
        <Sparkline
          points={props.state.points}
          labels={props.state.labels}
          className={variant.sparkline}
          ariaLabel={`Verifications, ${props.rangeLabel.toLowerCase()}`}
        />
      )}
      {props.state.status !== "error" ? (
        <span className="font-world text-11 text-portal-subtle">
          {props.rangeLabel}
        </span>
      ) : null}
    </div>
  );
};
