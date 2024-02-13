import clsx from "clsx";
import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export const IconFrame = (props: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "relative flex size-10 items-center justify-center rounded-full",
          props.className,
        ),
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(at_top_left,white,transparent)] opacity-30" />

      {props.children}
    </div>
  );
};
