"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { CloseIcon } from "@/components/Icons/CloseIcon";
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
  props: Omit<RadioProps, "value" | "disabled"> & {
    className?: string;
    option: { value: string; label: string };
    subtitle: string;
    stampText?: string;
    bullets: Bullet[];
    testId?: string;
  },
) => {
  return (
    <label
      className={twMerge(
        clsx(
          "grid cursor-pointer gap-y-2.5 rounded-[10px] border border-portal-border bg-surface px-5 py-4 transition-colors",
          "ring-offset-surface has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-edge-medium has-[input:focus-visible]:ring-offset-2",
          props.className,
        ),
      )}
      {...(props.testId ? { "data-testid": `card-${props.testId}` } : {})}
    >
      <div className="flex items-center justify-between gap-x-3">
        <span className="font-world text-15 leading-[1.2] font-medium text-content-ink select-none">
          {props.option.label}
        </span>

        <div className="flex items-center gap-x-2">
          {props.stampText && (
            <span className="inline-flex h-5 items-center rounded-full bg-portal-accent px-2 font-world text-12 leading-none font-medium whitespace-nowrap text-content-link">
              <span className={bubbleDigitClassName}>{props.stampText}</span>
            </span>
          )}

          <input
            type="radio"
            {...props.register}
            value={props.option.value}
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
              "border-[1.25px] border-portal-border peer-checked:hidden dark:border-control-border",
            )}
          />
          <span
            aria-hidden="true"
            className={clsx(
              markerBaseClassName,
              opticalIconClassName,
              "hidden bg-action peer-checked:flex",
            )}
          >
            <Icon name="radio-check" className="size-[13.333px] dark:invert" />
          </span>
        </div>
      </div>

      <p className="font-world text-13 leading-[1.3] font-[350] text-content-description">
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
                  className="mt-px size-3.5 shrink-0 text-content-ink"
                />
              ) : (
                <CloseIcon
                  className="mt-px size-3.5 shrink-0 text-content-error-500"
                  strokeWidth={2}
                />
              )}
              <span className="font-world text-13 leading-[1.4] font-[350] text-content-description">
                {bullet.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
};
