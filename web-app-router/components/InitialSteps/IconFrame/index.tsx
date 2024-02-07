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
          "h-10 w-10 rounded-full flex justify-center items-center relative",
          props.className,
        ),
      )}
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(at_top_left,white,transparent)] opacity-30 pointer-events-none" />

      {props.children}
    </div>
  );
};
