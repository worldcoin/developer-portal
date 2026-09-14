"use client";

import clsx from "clsx";
import React, { InputHTMLAttributes, memo } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

export interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  register?: UseFormRegisterReturn;
  required?: boolean;
  label?: string;
  disabled?: boolean;
  value: string;
  errors?: FieldError;
  className?: string;
}

export const Radio: React.FC<RadioProps> = memo(function Radio(
  props: RadioProps,
) {
  const { register, label, disabled, value, className, errors, ...restProps } =
    props;

  // Note we use 2 pseudo elements plus the input to form the border, inner ring and white circle.
  return (
    <div className={clsx("flex flex-row items-center gap-x-2", className)}>
      <input
        type="radio"
        {...register}
        value={value}
        id={value}
        {...restProps}
        className={clsx(
          "bg-surface after:size-[12px] after:shadow-[0_1px_1.4px_rgba(0,0,0,0.12)]", // Drop shadow with blur of 2.4 and 12% opacity
          "peer scale-125",
          "border-2 border-edge-medium", // Base classes for border and background
          "ring-offset-surface focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
          "before:absolute before:inset-0 before:m-auto before:content-['']", // Positioning the pseudo-element
          "before:rounded-full", // Sizing the pseudo-element to create the white circle
          "checked:before:bg-action",
          {
            "disabled:bg-surface-hover-soft": disabled,
            "hover:bg-surface-muted hover:checked:bg-action":
              !disabled && !errors,
          },
          "checked:before:bg-action checked:before:bg-linear-to-b checked:before:from-white/15 checked:before:to-transparent",
          "after:absolute after:inset-0 after:m-auto after:content-['']", // Positioning the pseudo-element
          "after:rounded-full checked:after:size-[5px] checked:after:bg-action-foreground",
        )}
        disabled={disabled}
      />

      {label && (
        <span
          className={clsx(
            "grid min-h-[30px] items-center font-gta text-14 leading-5 select-none",
            { "text-content-disabled": disabled },
            { "text-content-secondary": !disabled },
            {
              "hover:text-content-strong peer-checked:hover:text-content-secondary":
                !disabled && !errors,
            },
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
});
