import clsx from "clsx";
import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

// NOTE: these namings come from Figma
// TODO: review typography styles, they don't match figma, especially font-family and some of them are missing, i.e. s3, b3
export enum TYPOGRAPHY {
  H3 = "h3",
  H4 = "h4",
  H5 = "h5",
  H6 = "h6",
  H7 = "h7",

  M2 = "m2",
  M3 = "m3",
  M4 = "m4",
  M5 = "m5",

  R3 = "r3",
  R4 = "r4",
  R5 = "r5",
  R0 = "r0", // Custom typography for input synced with @lisa

  S2 = "s2",
  S3 = "s3",
  S4 = "s4",

  B3 = "b3",
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
          "font-twk text-5xl font-medium leading-[1.3]":
            variant === TYPOGRAPHY.H3,
          "font-twk text-4xl font-medium leading-[1.3]":
            variant === TYPOGRAPHY.H4,
          "font-twk text-3xl font-medium leading-[1.3]":
            variant === TYPOGRAPHY.H5,
          "font-twk text-2xl font-[550] leading-[1.3]":
            variant === TYPOGRAPHY.H6,
          "font-twk text-lg font-[550] leading-[1.3]":
            variant === TYPOGRAPHY.H7,

          "font-gta text-lg font-medium leading-[1.5]":
            variant === TYPOGRAPHY.M2,
          "font-gta text-base font-medium leading-[1.5]":
            variant === TYPOGRAPHY.M3,
          "font-gta text-sm font-medium leading-[1.4]":
            variant === TYPOGRAPHY.M4,
          "font-gta text-xs font-medium leading-[1.3]":
            variant === TYPOGRAPHY.M5,

          "font-gta text-base font-normal leading-[1.4] md:text-sm":
            variant === TYPOGRAPHY.R0,
          "font-gta text-base font-normal leading-[1.5]":
            variant === TYPOGRAPHY.R3,
          "font-gta text-sm font-normal leading-[1.4]":
            variant === TYPOGRAPHY.R4,
          "font-gta text-xs font-normal leading-[1.3]":
            variant === TYPOGRAPHY.R5,

          "font-world text-sm font-[325] leading-[1.3]":
            variant === TYPOGRAPHY.B3,
          "font-world text-xs font-[325] leading-[1.3]":
            variant === TYPOGRAPHY.B4,

          "font-world text-base font-[500] leading-[1.25]":
            variant === TYPOGRAPHY.S2,
          "font-world text-sm font-medium leading-[1.4]":
            variant === TYPOGRAPHY.S3,
          "font-rubik text-xs font-medium leading-[1.3]":
            variant === TYPOGRAPHY.S4,
        }),
      )}
      {...otherProps}
    >
      {children}
    </Component>
  );
};
