import clsx from "clsx";
import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { WorldIcon } from "./WorldIcon";

/** Lockup height in source art is 24px; lowercase "o" clearspace unit is 14px. */
export const WorldDevelopersLogo = ({
  className,
  lockupClassName,
  ...props
}: ComponentProps<"span"> & { lockupClassName?: string }) => {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center whitespace-nowrap font-world leading-none text-grey-900",
          "gap-[0.42em] p-[calc(var(--lockup-h)*14/24)] text-[length:calc(var(--lockup-h)*0.72)] [--lockup-h:1.75rem]",
          className,
        ),
      )}
      {...props}
    >
      <WorldIcon
        aria-hidden
        className={twMerge(
          "size-[var(--lockup-h)] shrink-0 [&_path]:fill-current",
          lockupClassName,
        )}
      />
      <span aria-hidden>world Developers</span>
    </span>
  );
};
