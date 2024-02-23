import clsx from "clsx";
import { memo } from "react";
import { twMerge } from "tailwind-merge";

type ChevronLeftIconProps = {
  className?: string;
};

export const ChevronLeftIcon = memo(function Icon(props: ChevronLeftIconProps) {
  const { className } = props;

  return (
    <svg
      className={twMerge(clsx(`size-6`, className))}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 6L9.70711 11.2929C9.37377 11.6262 9.20711 11.7929 9.20711 12C9.20711 12.2071 9.37377 12.3738 9.70711 12.7071L15 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});
