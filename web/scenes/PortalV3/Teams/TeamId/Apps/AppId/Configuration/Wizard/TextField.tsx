"use client";

import clsx from "clsx";
import { KeyboardEventHandler, ReactNode, useState } from "react";
import Skeleton from "react-loading-skeleton";

/**
 * Wizard text field with the label floating inside the box. The box chrome is
 * a constant white bordered box — empty fields must not read as greyed-out
 * (and a constant box means focusing never reflows the layout); only the
 * label floats: a single 15px placeholder line when empty + unfocused, the
 * 13px label above the 15px value otherwise. `muted` (the app ID) uses the
 * canvas background instead. The error state keeps `bg-system-error-50` so
 * the review flow's scroll-to-first-error (which queries that class) can
 * find the field.
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
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  trailing?: ReactNode;
  className?: string;
  /** Keep the field accessible while omitting a label already shown nearby. */
  hideLabel?: boolean;
  /**
   * Skeleton mode: same box chrome, floating label, shimmer in the value
   * slot, no input. `value` is ignored.
   */
  loading?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating =
    !props.hideLabel &&
    (props.loading || props.readOnly || isFocused || props.value.length > 0);
  const isInert = props.loading || props.readOnly || props.disabled;

  const requiredMark = props.required && (
    // Figma nucleus/status-negative (#ea392a) — no portal token for it yet.
    <span className="text-[#ea392a]"> *</span>
  );

  return (
    <div className={clsx("flex w-full flex-col gap-1.5", props.className)}>
      <label
        className={clsx(
          // relative: the empty-state input is `sr-only` (absolute) but keeps
          // w-full, so without a positioned label its 100% resolves against
          // the page-wide inset and the invisible box drags a horizontal
          // scrollbar into whitespace.
          "relative flex h-14 w-full items-center gap-2 rounded-[10px] border p-4",
          isInert ? "cursor-default" : "cursor-text",
          props.disabled && "opacity-60",
          props.error
            ? "border-[#ea392a] bg-system-error-50"
            : props.muted
              ? "border-portal-border bg-portal-canvas"
              : "border-portal-border bg-white",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col overflow-clip">
          {!props.hideLabel && (
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
          )}
          {props.loading ? (
            <span className="w-full text-15 leading-[1.3] font-[350]">
              <Skeleton width="40%" />
            </span>
          ) : (
            <input
              name={props.name}
              type={props.type ?? "text"}
              value={props.value}
              aria-label={props.hideLabel ? props.label : undefined}
              readOnly={props.readOnly}
              disabled={props.disabled}
              maxLength={props.maxLength}
              onChange={(event) => props.onChange?.(event.target.value)}
              onKeyDown={props.onKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                props.onBlur?.();
              }}
              className={clsx(
                "w-full min-w-0 bg-transparent p-0 text-15 leading-[1.3] font-[350] text-portal-ink outline-none",
                !props.hideLabel && !isFloating && "sr-only",
              )}
            />
          )}
          {!props.hideLabel && !isFloating && (
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
