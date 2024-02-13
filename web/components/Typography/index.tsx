import clsx from "clsx";
import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

// NOTE: these namings come from Figma
export enum TYPOGRAPHY {
  H6 = "h6",
  H7 = "h7",

  M2 = "m2",
  M3 = "m3",
  M4 = "m4",
  M5 = "m5",

  R3 = "r3",
  R4 = "r4",
  R5 = "r5",

  S3 = "s3",

  B4 = "b4",
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
          "font-twk text-2xl font-medium leading-[1.3]":
            variant === TYPOGRAPHY.H6,
          "font-twk text-lg font-medium leading-[1.3]":
            variant === TYPOGRAPHY.H7,

          "font-gta text-2xl font-medium leading-[1.5]":
            variant === TYPOGRAPHY.M2,
          "font-gta text-base font-medium leading-[1.5]":
            variant === TYPOGRAPHY.M3,
          "font-gta text-sm font-medium leading-[1.4]":
            variant === TYPOGRAPHY.M4,
          "font-gta text-xs font-medium leading-[1.3]":
            variant === TYPOGRAPHY.M5,

          "font-gta text-base font-normal leading-[1.5]":
            variant === TYPOGRAPHY.R3,
          "font-gta text-sm font-normal leading-[1.4]":
            variant === TYPOGRAPHY.R4,
          "font-gta text-xs font-normal leading-[1.3]":
            variant === TYPOGRAPHY.R5,

          "font-rubik text-xs font-normal leading-[1.3]":
            variant === TYPOGRAPHY.B4,

          "font-rubik text-sm font-medium leading-[1.4]":
            variant === TYPOGRAPHY.S3,
        }),
      )}
      {...otherProps}
    >
      {children}
    </Component>
  );
};
