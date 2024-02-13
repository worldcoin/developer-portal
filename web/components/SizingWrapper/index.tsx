import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const SizingWrapper = (props: {
  children: ReactNode;
  className?: string;
  gridClassName?: string;
  variant?: "content" | "nav";
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "grid size-full grid-cols-[minmax(24px,1fr)_minmax(0,calc(1440px-9vw*2))_minmax(24px,1fr)] ",
          {
            " 2xl:grid-cols-[minmax(24px,1fr)_minmax(0,calc(1920px-9vw*2))_minmax(24px,1fr)]":
              props.variant === "nav",
          },
          props.gridClassName,
        ),
      )}
    >
      <div className={twMerge(clsx("col-start-2", props.className))}>
        {props.children}
      </div>
    </div>
  );
};
