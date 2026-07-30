"use client";

import clsx from "clsx";
import { useState } from "react";

/**
 * Multiline sibling of TextField with the same floating-label behavior on a
 * constant white bordered box (empty fields must not read as greyed-out):
 * empty + unfocused shows a single 15px placeholder line; focused or filled
 * shows the 13px label above the value. The error state keeps
 * `bg-system-error-50` so the review flow's scroll-to-first-error (which
 * queries that class) can find the field.
 */
export const TextAreaField = (props: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  name?: string;
  className?: string;
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || props.value.length > 0;

  return (
    <div className={clsx("flex w-full flex-col gap-1.5", props.className)}>
      <label
        className={clsx(
          // relative: see TextField — the sr-only empty-state control keeps
          // w-full and must resolve it against this box, not the page.
          "relative flex h-30 w-full flex-col rounded-[10px] border p-4",
          props.disabled ? "cursor-default opacity-60" : "cursor-text",
          props.error
            ? "border-system-error-500 bg-system-error-50"
            : "border-portal-border bg-grey-0",
        )}
      >
        <span
          className={clsx(
            "w-full text-13 leading-[1.3] font-[350]",
            props.error ? "text-system-error-500" : "text-portal-subtle",
            !isFloating && "hidden",
          )}
        >
          {props.label}
          {props.required && (
            // Figma nucleus/status-negative (#ea392a) = system-error-500.
            <span className="text-system-error-500"> *</span>
          )}
        </span>
        <textarea
          name={props.name}
          value={props.value}
          disabled={props.disabled}
          maxLength={props.maxLength}
          onChange={(event) => props.onChange?.(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            props.onBlur?.();
          }}
          className={clsx(
            "w-full min-w-0 flex-1 resize-none bg-transparent p-0 text-15 leading-[1.3] font-[350] text-portal-ink outline-none",
            !isFloating && "sr-only",
          )}
        />
        {!isFloating && (
          <span className="w-full text-15 leading-[1.3] font-[350] text-portal-subtle">
            {props.label}
          </span>
        )}
        {props.maxLength && isFloating && (
          <span className="w-full text-right text-13 leading-[1.3] font-[350] text-portal-subtle">
            {props.value.length}/{props.maxLength}
          </span>
        )}
      </label>
      {props.error && (
        <p className="text-13 leading-[1.3] font-[350] text-system-error-500">
          {props.error}
        </p>
      )}
    </div>
  );
};
