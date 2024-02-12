import clsx from "clsx";
import { memo } from "react";
import { twMerge } from "tailwind-merge";

type ArrowRightIconProps = {
  className?: string;
};

export const ArrowRightIcon = memo(function Icon(props: ArrowRightIconProps) {
  const { className } = props;

  return (
    <div className={twMerge(clsx(`h-6 w-6`, className))}>
      <svg
        className="h-full w-full"
        viewBox="0 0 25 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.5 8L18.5 12M18.5 12L14.5 16M18.5 12L6.5 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});
