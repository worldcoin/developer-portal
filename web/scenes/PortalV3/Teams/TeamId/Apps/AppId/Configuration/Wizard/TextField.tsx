"use client";

import clsx from "clsx";
import { ReactNode, useState } from "react";

/**
 * Wizard text field with the label floating inside the box. Empty + unfocused
 * shows a single 15px placeholder line on the canvas background; focused or
 * filled shows the 13px label above the 15px value on a white bordered box.
 * `muted` (the app ID) keeps the canvas background with a border instead.
 * The error state keeps `bg-system-error-50` so the review flow's
 * scroll-to-first-error (which queries that class) can find the field.
 */
export const TextField = (props: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  error?: string;
  /** Canvas-background bordered box, like the ID field in the design. */
  muted?: boolean;
  name?: string;
  type?: string;
  maxLength?: number;
  trailing?: ReactNode;
  className?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = props.readOnly || isFocused || props.value.length > 0;
  const isInert = props.readOnly || props.disabled;

  const requiredMark = props.required && (
    // Figma nucleus/status-negative (#ea392a) — no portal token for it yet.
    <span className="text-[#ea392a]"> *</span>
  );

  return (
    <div className={clsx("flex w-full flex-col gap-1.5", props.className)}>
      <label
        className={clsx(
          "flex h-14 w-full items-center gap-2 rounded-[10px] border p-4",
          isInert ? "cursor-default" : "cursor-text",
          props.disabled && "opacity-60",
          props.error
            ? "border-[#ea392a] bg-system-error-50"
            : props.muted
              ? "border-portal-border bg-portal-canvas"
              : isFloating
                ? "border-portal-border bg-white"
                : // Borderless in Figma; transparent border keeps the box
                  // metrics identical across states.
                  "border-transparent bg-portal-canvas",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col overflow-clip">
          <span
            className={clsx(
              "w-full text-13 leading-[1.3] font-[350]",
              props.error ? "text-[#ea392a]" : "text-portal-subtle",
              !isFloating && "hidden",
            )}
          >
            {props.label}
            {requiredMark}
          </span>
          <input
            name={props.name}
            type={props.type ?? "text"}
            value={props.value}
            readOnly={props.readOnly}
            disabled={props.disabled}
            maxLength={props.maxLength}
            onChange={(event) => props.onChange?.(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              props.onBlur?.();
            }}
            className={clsx(
              "w-full min-w-0 bg-transparent p-0 text-15 leading-[1.3] font-[350] text-portal-ink outline-none",
              !isFloating && "sr-only",
            )}
          />
          {!isFloating && (
            <span className="w-full text-15 leading-[1.3] font-[350] text-portal-subtle">
              {props.label}
              {requiredMark}
            </span>
          )}
        </span>
        {props.trailing}
      </label>
      {props.error && (
        <p className="text-13 leading-[1.3] font-[350] text-[#ea392a]">
          {props.error}
        </p>
      )}
    </div>
  );
};
