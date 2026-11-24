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
          "font-twk text-5xl leading-[1.3] font-medium":
            variant === TYPOGRAPHY.H3,
          "font-twk text-4xl leading-[1.3] font-medium":
            variant === TYPOGRAPHY.H4,
          "font-twk text-3xl leading-[1.3] font-medium":
            variant === TYPOGRAPHY.H5,
          "font-twk text-2xl leading-[1.3] font-[550]":
            variant === TYPOGRAPHY.H6,
          "font-twk text-lg leading-[1.3] font-[550]":
            variant === TYPOGRAPHY.H7,

          "font-gta text-lg leading-normal font-medium":
            variant === TYPOGRAPHY.M2,
          "font-gta text-base leading-normal font-medium":
            variant === TYPOGRAPHY.M3,
          "font-gta text-sm leading-[1.4] font-medium":
            variant === TYPOGRAPHY.M4,
          "font-gta text-xs leading-[1.3] font-medium":
            variant === TYPOGRAPHY.M5,

          "font-gta text-base leading-[1.4] font-normal md:text-sm":
            variant === TYPOGRAPHY.R0,
          "font-gta text-base leading-normal font-normal":
            variant === TYPOGRAPHY.R3,
          "font-gta text-sm leading-[1.4] font-normal":
            variant === TYPOGRAPHY.R4,
          "font-gta text-xs leading-[1.3] font-normal":
            variant === TYPOGRAPHY.R5,

          "font-world text-sm leading-[1.3] font-[325]":
            variant === TYPOGRAPHY.B3,
          "font-world text-xs leading-[1.3] font-[325]":
            variant === TYPOGRAPHY.B4,

          "font-world text-base leading-tight font-medium":
            variant === TYPOGRAPHY.S2,
          "font-world text-sm leading-[1.4] font-medium":
            variant === TYPOGRAPHY.S3,
          "font-world text-xs leading-[1.3] font-medium":
            variant === TYPOGRAPHY.S4,
        }),
      )}
      {...otherProps}
    >
      {children}
    </Component>
  );
};
