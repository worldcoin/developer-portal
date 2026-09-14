import { Button } from "@/components/Button";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

const destructiveTriggerDisplayClassName = "inline-flex";
const destructiveTriggerOutlineClassName =
  "h-8 items-center justify-center rounded-full border border-edge-error-300 bg-surface px-4 font-world leading-none font-medium whitespace-nowrap text-content-error-600 outline-hidden transition-colors hover:border-edge-error-400 hover:bg-surface-error-50 focus-visible:ring-2 focus-visible:ring-edge-error-300 focus-visible:ring-offset-2 ring-offset-surface disabled:cursor-not-allowed disabled:border-edge-error-100 disabled:bg-surface disabled:text-content-error-300 disabled:hover:bg-surface";
const destructiveTriggerSolidClassName =
  "h-8 items-center justify-center rounded-full border-0 bg-[#ea392a] dark:bg-system-error-600 px-[14px] font-world leading-[1.2] font-[550] tracking-[-0.01em] whitespace-nowrap text-white outline-hidden transition-colors hover:bg-system-error-600 dark:hover:bg-system-error-800 focus-visible:ring-2 focus-visible:ring-edge-error-300 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:bg-surface-error-300 dark:disabled:bg-surface-error-300";

type DestructiveTriggerButtonProps = ComponentProps<"button"> & {
  appearance?: "outline" | "solid";
};

export const DestructiveTriggerButton = (
  props: DestructiveTriggerButtonProps,
) => {
  const {
    appearance = "outline",
    className,
    type = "button",
    ...buttonProps
  } = props;
  const visualClassName =
    appearance === "solid"
      ? destructiveTriggerSolidClassName
      : destructiveTriggerOutlineClassName;

  return (
    <Button
      {...buttonProps}
      type={type}
      className={`${twMerge(
        destructiveTriggerDisplayClassName,
        className,
        visualClassName,
      )} text-13`}
    />
  );
};
