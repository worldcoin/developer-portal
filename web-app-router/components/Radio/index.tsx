"use client";

import clsx from "clsx";
import React, { memo } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

type RadioProps = {
  register: UseFormRegisterReturn;
  required?: boolean;
  label: string;
  disabled?: boolean;
  value: string;
  errors?: FieldError;
  className?: string;
};

export const Radio: React.FC<RadioProps> = memo(function Radio(
  props: RadioProps
) {
  const { register, label, disabled, value, className, errors } = props;

  // Note we use 2 pseudo elements plus the input to form the border, inner ring and white circle.
  return (
    <label className={clsx("flex flex-row items-center", className)}>
      <input
        type="radio"
        {...register}
        value={value}
        id={value}
        className={clsx(
          "after:shadow-[0_1px_1.4px_rgba(0,0,0,0.12)] after:w-[12px] after:h-[12px] bg-white", // Drop shadow with blur of 2.4 and 12% opacity
          "transform scale-125 peer",
          "mr-2 border-2 border-grey-300", // Base classes for border and background
          "focus:ring-0 focus:ring-transparent",
          "before:content-[''] before:absolute before:top-0 before:left-0 before:bottom-0 before:right-0 before:m-auto", // Positioning the pseudo-element
          "before:w-3 before:h-3 before:rounded-full", // Sizing the pseudo-element to create the white circle
          "checked:before:bg-grey-900",
          {
            "disabled:bg-grey-70": disabled,
            "hover:bg-grey-100 hover:checked:bg-grey-900": !disabled && !errors,
          },
          "checked:bg-gradient-to-b checked:bg-grey-900 checked:from-white/15 checked:to-transparent",
          "after:content-[''] after:absolute after:top-0 after:left-0 after:bottom-0 after:right-0 after:m-auto", // Positioning the pseudo-element
          "after:checked:w-1.5 after:checked:h-1.5 after:rounded-full checked:after:bg-white"
        )}
        disabled={disabled}
      />
      <span
        className={clsx(
          "min-h-[30px] grid items-center select-none text-14 leading-5 font-gta",
          { "text-grey-300": disabled },
          { "text-grey-500": !disabled },
          {
            "hover:text-grey-700 hover:peer-checked:text-grey-500":
              !disabled && !errors,
          }
        )}
      >
        {label}
      </span>
    </label>
  );
});
