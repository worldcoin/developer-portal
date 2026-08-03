"use client";

import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";

export type AppMode = "mini-app" | "external";

const APP_MODES: { value: AppMode; title: string; description: string }[] = [
  {
    value: "mini-app",
    title: "Mini App",
    description: "Create a mini app that runs inside the World App.",
  },
  {
    value: "external",
    title: "External",
    description: "Create a World ID app that runs outside the World App.",
  },
];

/**
 * Loading takes no selection: which mode is chosen is exactly the data the
 * skeleton is waiting on, so `value`/`onChange` are unavailable in that case.
 */
type AppModeCardsProps = { disabled?: boolean } & (
  | { loading: true; value?: never; onChange?: never }
  | { loading?: false; value: AppMode; onChange: (value: AppMode) => void }
);

/**
 * "Advanced settings" radio cards choosing between Mini App and External.
 * `loading` keeps the static card chrome but shimmers the selection marker.
 */
export const AppModeCards = (props: AppModeCardsProps) => (
  <div className="flex w-full items-start gap-4">
    {APP_MODES.map((mode) => {
      const isSelected = !props.loading && props.value === mode.value;
      return (
        <label
          key={mode.value}
          className={clsx(
            "flex min-w-0 flex-1 flex-col gap-3 rounded-[10px] border border-portal-border px-6 py-5",
            {
              "opacity-60": props.disabled,
              "cursor-default": props.disabled || props.loading,
              "cursor-pointer": !props.disabled && !props.loading,
            },
          )}
        >
          <span className="flex w-full items-center justify-between">
            <span className="text-15 leading-[1.2] font-medium whitespace-nowrap text-portal-ink">
              {mode.title}
            </span>
            {props.loading && (
              <Skeleton
                circle
                width={20}
                height={20}
                containerClassName={clsx(
                  "flex size-5 shrink-0",
                  opticalIconClassName,
                )}
              />
            )}
            {!props.loading && (
              <>
                <input
                  type="radio"
                  name="app-mode"
                  value={mode.value}
                  checked={isSelected}
                  disabled={props.disabled}
                  onChange={() => props.onChange(mode.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={clsx(
                    "flex size-5 shrink-0 items-center justify-center rounded-full",
                    // Optical lift against the cap-height card title, applied to
                    // both selected and unselected markers so they stay aligned.
                    opticalIconClassName,
                    isSelected
                      ? "bg-portal-ink"
                      : "border-[1.25px] border-portal-border",
                  )}
                >
                  {isSelected && (
                    <Icon name="radio-check" className="size-[13.333px]" />
                  )}
                </span>
              </>
            )}
          </span>
          {/* Description wraps at 218px in Figma (hug-content text box). Color
              is nucleus/foreground-secondary (#7d7d7d) — no portal token. */}
          <span className="max-w-[218px] text-13 leading-[1.3] font-[350] text-[#7d7d7d]">
            {mode.description}
          </span>
        </label>
      );
    })}
  </div>
);
