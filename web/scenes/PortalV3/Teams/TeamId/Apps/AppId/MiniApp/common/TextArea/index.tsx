"use client";

import clsx from "clsx";
import { TextareaHTMLAttributes, forwardRef } from "react";

/**
 * Multi-line sibling of the Wizard's TextField, with the same box chrome
 * (bordered white box, 10px radius, floating 13px label) so the Notifications
 * form stops mixing borderless grey boxes into a bordered-white tab.
 */
export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    error?: string;
    hint?: string;
  }
>(function TextArea({ label, error, hint, className, id, ...rest }, ref) {
  const hintId = hint || error ? `${id ?? label}-hint` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        className={clsx(
          "flex w-full flex-col gap-1 rounded-[10px] border p-4",
          error
            ? "border-[#ea392a] bg-system-error-50"
            : "border-portal-border bg-white",
        )}
      >
        <span
          className={clsx(
            "text-13 leading-[1.3] font-[350]",
            error ? "text-[#ea392a]" : "text-portal-subtle",
          )}
        >
          {label}
        </span>

        <textarea
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={hintId}
          className={clsx(
            "w-full min-w-0 resize-none bg-transparent p-0 text-15 leading-[1.3] font-[350] text-portal-ink outline-none placeholder:text-portal-subtle",
            className,
          )}
          {...rest}
        />
      </label>

      {(hint || error) && (
        <p
          id={hintId}
          className={clsx(
            "text-13 leading-[1.3] font-[350]",
            error ? "text-[#ea392a]" : "text-portal-subtle",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
