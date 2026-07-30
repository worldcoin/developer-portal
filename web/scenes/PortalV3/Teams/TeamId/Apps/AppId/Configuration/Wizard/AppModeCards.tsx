"use client";

import { Icon } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";

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

/** "Advanced settings" radio cards choosing between Mini App and External. */
export const AppModeCards = (props: {
  value: AppMode;
  onChange: (value: AppMode) => void;
  disabled?: boolean;
}) => (
  <div className="flex w-full items-start gap-4">
    {APP_MODES.map((mode) => {
      const isSelected = props.value === mode.value;
      return (
        <label
          key={mode.value}
          className={clsx(
            "flex min-w-0 flex-1 flex-col gap-3 rounded-[10px] border border-portal-border px-6 py-5",
            props.disabled ? "cursor-default opacity-60" : "cursor-pointer",
          )}
        >
          <span className="flex w-full items-center justify-between">
            <span className="text-15 leading-[1.2] font-medium whitespace-nowrap text-portal-ink">
              {mode.title}
            </span>
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
                isSelected
                  ? "bg-portal-ink"
                  : "border-[1.25px] border-portal-border",
              )}
            >
              {isSelected && (
                <Icon name="radio-check" className="size-[13.333px]" />
              )}
            </span>
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
