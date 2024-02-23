import clsx from "clsx";
import { ComponentProps, memo } from "react";
import { twMerge } from "tailwind-merge";

export const ChevronRightIcon = memo(function Icon(
  props: ComponentProps<"svg">,
) {
  const { className, ...otherProps } = props;

  return (
    <svg
      className={twMerge(clsx(`size-6`, className))}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...otherProps}
    >
      <path
        d="M9 18L14.2929 12.7071C14.6262 12.3738 14.7929 12.2071 14.7929 12C14.7929 11.7929 14.6262 11.6262 14.2929 11.2929L9 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
