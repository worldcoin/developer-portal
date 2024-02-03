import clsx from "clsx";
import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

// NOTE: these namings come from Figma
export enum TYPOGRAPHY {
  H6 = "h6",
  H7 = "h7",

  M3 = "m3",
  M4 = "m4",

  R3 = "r3",
  R4 = "r4",
  R5 = "r5",
}

type TypographyProps<T extends ElementType = "span"> = {
  variant?: TYPOGRAPHY;
  as?: T;
  children: ReactNode;
  className?: string;
};

export const Typography = <T extends ElementType = "span">(
  props: TypographyProps<T> & ComponentPropsWithoutRef<T>,
) => {
  const {
    as: Component = "span",
    children,
    className,
    variant,
    ...otherProps
  } = props;

  return (
    <Component
      className={twMerge(
        clsx(className, {
          "text-2xl leading-[1.3] font-medium font-twk":
            variant === TYPOGRAPHY.H6,
          "text-lg leading-[1.3] font-medium font-twk":
            variant === TYPOGRAPHY.H7,

          "text-base leading-[1.5] font-medium font-gta":
            variant === TYPOGRAPHY.M3,
          "text-sm leading-[1.4] font-medium font-gta":
            variant === TYPOGRAPHY.M4,

          "text-base leading-[1.5] font-normal font-gta":
            variant === TYPOGRAPHY.R3,
          "text-sm leading-[1.4] font-normal font-gta":
            variant === TYPOGRAPHY.R4,
          "text-xs leading-[1.3] font-normal font-gta":
            variant === TYPOGRAPHY.R5,
        }),
      )}
      {...otherProps}
    >
      {children}
    </Component>
  );
};
