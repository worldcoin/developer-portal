import { Button } from "@/components/Button";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

const destructiveTriggerDisplayClassName = "inline-flex";
const destructiveTriggerVisualClassName =
  "h-8 items-center justify-center rounded-full border border-system-error-300 bg-white px-4 font-world leading-none font-medium whitespace-nowrap text-system-error-600 outline-hidden transition-colors hover:border-system-error-400 hover:bg-system-error-50 focus-visible:ring-2 focus-visible:ring-system-error-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-system-error-100 disabled:bg-white disabled:text-system-error-300 disabled:hover:bg-white";

type DestructiveTriggerButtonProps = ComponentProps<"button">;

export const DestructiveTriggerButton = (
  props: DestructiveTriggerButtonProps,
) => {
  const { className, type = "button", ...buttonProps } = props;

  return (
    <Button
      {...buttonProps}
      type={type}
      className={`${twMerge(
        destructiveTriggerDisplayClassName,
        className,
        destructiveTriggerVisualClassName,
      )} text-13`}
    />
  );
};
