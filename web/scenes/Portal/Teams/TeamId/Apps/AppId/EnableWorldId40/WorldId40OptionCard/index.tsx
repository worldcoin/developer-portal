"use client";

import { CheckIcon } from "@/components/Icons/CheckIcon";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Radio, RadioProps } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

type Bullet = { text: string; variant: "check" | "x" };

export const WorldId40OptionCard = (
  props: Omit<RadioProps, "value"> & {
    className?: string;
    option: { value: string; label: string };
    subtitle: string;
    stampText?: string;
    /** Shown in stamp slot when disabled (e.g. "Coming Soon") */
    disabledStampText?: string;
    bullets: Bullet[];
    testId?: string;
    disabled?: boolean;
  },
) => {
  const { disabled = false } = props;
  const stampContent = disabled
    ? props.disabledStampText ?? props.stampText
    : props.stampText;
  const stampClassName = disabled
    ? "rounded-full bg-grey-100 px-2 py-0.5 text-grey-500"
    : "rounded-full bg-additional-azure-100 px-2 py-0.5 text-additional-azure-500";
  return (
    <label
      className={twMerge(
        clsx(
          "grid gap-y-3 rounded-lg border border-grey-100 bg-white px-6 py-5 shadow-[0_1.3px_2.6px_rgba(0,0,0,0.053)] transition-colors",
          !disabled && "cursor-pointer ",
          disabled && "cursor-not-allowed opacity-60",
          props.className,
        ),
      )}
      {...(props.testId ? { "data-testid": `card-${props.testId}` } : {})}
      {...(disabled ? { "data-disabled": "true" } : {})}
    >
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-auto/1fr items-center gap-x-2">
          <Radio
            register={props.register}
            value={props.option.value}
            disabled={disabled}
            {...(props.testId
              ? { "data-testid": `radio-${props.testId}` }
              : {})}
          />
          <Typography variant={TYPOGRAPHY.M3} className="select-none">
            {props.option.label}
          </Typography>
        </div>
        {stampContent && (
          <Typography
            as="div"
            variant={TYPOGRAPHY.M5}
            className={stampClassName}
          >
            {stampContent}
          </Typography>
        )}
      </div>

      <Typography variant={TYPOGRAPHY.R4} className="text-[#939BA5]">
        {props.subtitle}
      </Typography>

      {(props.bullets?.length ?? 0) > 0 && (
        <ul className="grid gap-y-2">
          {props.bullets.map((bullet, i) => (
            <li key={i} className="flex items-center gap-x-2">
              {bullet.variant === "check" ? (
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-additional-azure-100 text-additional-azure-500">
                  <CheckIcon size="16" variant="shortTail" className="size-3" />
                </span>
              ) : (
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-system-error-50 text-system-error-500">
                  <CloseIcon className="size-3" strokeWidth={2} />
                </span>
              )}
              <Typography variant={TYPOGRAPHY.R4} className="text-[#939BA5]">
                {bullet.text}
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
};
