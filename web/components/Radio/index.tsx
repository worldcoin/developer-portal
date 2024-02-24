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
          "bg-white after:size-[12px] after:shadow-[0_1px_1.4px_rgba(0,0,0,0.12)]", // Drop shadow with blur of 2.4 and 12% opacity
          "peer scale-125",
          "border-2 border-grey-300", // Base classes for border and background
          "focus:outline-none focus:ring-0 focus:ring-transparent",
          "before:absolute before:inset-0 before:m-auto before:content-['']", // Positioning the pseudo-element
          "before:rounded-full", // Sizing the pseudo-element to create the white circle
          "checked:before:bg-grey-900",
          {
            "disabled:bg-grey-70": disabled,
            "hover:bg-grey-100 hover:checked:bg-grey-900": !disabled && !errors,
          },
          "before:checked:bg-grey-900 before:checked:bg-gradient-to-b before:checked:from-white/15 before:checked:to-transparent",
          "after:absolute after:inset-0 after:m-auto after:content-['']", // Positioning the pseudo-element
          "after:rounded-full after:checked:size-[5px] checked:after:bg-white",
        )}
        disabled={disabled}
      />

      {label && (
        <span
          className={clsx(
            "grid min-h-[30px] select-none items-center font-gta text-14 leading-5",
            { "text-grey-300": disabled },
            { "text-grey-500": !disabled },
            {
              "hover:text-grey-700 hover:peer-checked:text-grey-500":
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
