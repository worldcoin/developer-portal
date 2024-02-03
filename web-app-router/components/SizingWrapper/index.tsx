import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const SizingWrapper = (props: {
  children: ReactNode;
  className?: string;
  gridClassName?: string;
}) => {
  return (
    <div
      className={twMerge(
        "grid grid-cols-[minmax(24px,1fr)_minmax(0,calc(1440px-9vw*2))_minmax(24px,1fr)] h-full w-full",
        props.gridClassName
      )}
    >
      <div className={twMerge(clsx("col-start-2", props.className))}>
        {props.children}
      </div>
    </div>
  );
};
