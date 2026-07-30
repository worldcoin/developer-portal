"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { InformationCircleIcon } from "@/components/Icons/InformationCircleIcon";
import { RadioProps } from "@/components/Radio";
import {
  bubbleDigitClassName,
  Icon,
  opticalIconClassName,
} from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

type Bullet = { text: string; variant: "check" | "x" };

const markerBaseClassName =
  "flex size-5 shrink-0 items-center justify-center rounded-full transition-colors";

export const WorldId40OptionCard = (
  props: Omit<RadioProps, "value"> & {
    className?: string;
    option: { value: string; label: string };
    subtitle: string;
    stampText?: string;
    /** Shown in stamp slot when disabled (e.g. "Coming Soon") */
    disabledStampText?: string;
    disabledReason?: string;
    bullets: Bullet[];
    testId?: string;
    disabled?: boolean;
  },
) => {
  const { disabled = false } = props;
  const stampContent = disabled
    ? props.disabledStampText ?? props.stampText
    : props.stampText;
  // Neutral hairline chip; the azure dot carries the stamp's accent instead
  // of a tinted container.
  const stampClassName = disabled
    ? "bg-portal-canvas text-portal-muted"
    : "bg-portal-accent text-portal-blue";
  return (
    <label
      className={twMerge(
        clsx(
          "grid gap-y-2.5 rounded-[10px] border border-portal-border bg-white px-5 py-4 transition-colors",
          "has-checked:border-portal-ink",
          "has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-grey-300 has-[input:focus-visible]:ring-offset-2",
          !disabled && "cursor-pointer",
          disabled && "cursor-not-allowed opacity-60",
          props.className,
        ),
      )}
      {...(props.testId ? { "data-testid": `card-${props.testId}` } : {})}
      {...(disabled ? { "data-disabled": "true" } : {})}
    >
      <div className="flex items-center justify-between gap-x-3">
        <span className="font-world text-15 leading-[1.2] font-medium text-portal-ink select-none">
          {props.option.label}
        </span>

        <div className="flex items-center gap-x-2">
          {stampContent && (
            <span
              className={clsx(
                "inline-flex h-5 items-center rounded-full px-2 font-world text-12 leading-none font-medium whitespace-nowrap",
                stampClassName,
              )}
            >
              <span className={bubbleDigitClassName}>{stampContent}</span>
            </span>
          )}
          {disabled && props.disabledReason && (
            <div className="group relative">
              <span
                tabIndex={0}
                aria-label={props.disabledReason}
                title={props.disabledReason}
                className="inline-flex outline-hidden focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-1"
              >
                <InformationCircleIcon className="size-4 text-portal-subtle" />
              </span>
              <div className="pointer-events-none absolute -top-2 right-0 z-20 w-48 -translate-y-full rounded-md bg-portal-ink px-2 py-1.5 font-world text-12 leading-[1.4] text-white opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                {props.disabledReason}
                <div className="absolute right-3 -bottom-1 h-2 w-2 rotate-45 bg-portal-ink" />
              </div>
            </div>
          )}

          <input
            type="radio"
            {...props.register}
            value={props.option.value}
            disabled={disabled}
            className="peer sr-only"
            {...(props.testId
              ? { "data-testid": `radio-${props.testId}` }
              : {})}
          />
          <span
            aria-hidden="true"
            className={clsx(
              markerBaseClassName,
              opticalIconClassName,
              "border-[1.25px] border-portal-border peer-checked:hidden",
            )}
          />
          <span
            aria-hidden="true"
            className={clsx(
              markerBaseClassName,
              opticalIconClassName,
              "hidden bg-portal-ink peer-checked:flex",
            )}
          >
            <Icon name="radio-check" className="size-[13.333px]" />
          </span>
        </div>
      </div>

      <p className="font-world text-13 leading-[1.3] font-[350] text-[#7d7d7d]">
        {props.subtitle}
      </p>

      {(props.bullets?.length ?? 0) > 0 && (
        <ul className="grid gap-y-1.5">
          {props.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-x-2">
              {bullet.variant === "check" ? (
                <CheckIcon
                  size="16"
                  variant="shortTail"
                  className="mt-px size-3.5 shrink-0 text-portal-ink"
                />
              ) : (
                <CloseIcon
                  className="mt-px size-3.5 shrink-0 text-system-error-500"
                  strokeWidth={2}
                />
              )}
              <span className="font-world text-13 leading-[1.4] font-[350] text-[#7d7d7d]">
                {bullet.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
};
