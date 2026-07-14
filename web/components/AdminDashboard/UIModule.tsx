import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type UIModuleProps = {
  children: ReactNode;
  className?: string;
};

export const UIModule = ({ children, className }: UIModuleProps) => {
  return (
    <div
      className={twMerge(
        "overscroll-none rounded-16 border border-grey-200 bg-grey-0/90 p-1.5 shadow-lg backdrop-blur-md",
        className,
      )}
    >
      {children}
    </div>
  );
};
