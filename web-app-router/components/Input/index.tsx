"use client";
import clsx from "clsx";
import { InputHTMLAttributes, memo, useState } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface InputInterface extends InputHTMLAttributes<HTMLInputElement> {
  register: UseFormRegisterReturn;
  required?: boolean;
  currentValue?: string;
  errors?: FieldError;
  isDirty?: boolean;
  label: string;
  placeholder?: string;
  helperText?: string;
  addOn?: React.ReactElement;
  addOnPosition?: "left" | "right";
  className?: string;
}

export const Input = memo(function Input(props: InputInterface) {
  const {
    register,
    required,
    helperText,
    label,
    placeholder,
    className,
    errors,
    addOn,
    addOnPosition,
    disabled,
    ...restProps
  } = props;

  const parentClassNames = clsx(
    "border-[1px] text-gray-700 rounded-lg bg-gray-0 px-2 text-sm",
    {
      "border-gray-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-gray-700 ":
        !errors && !disabled,
      "border-error-500 text-error-500 focus-within:border-error-500":
        errors && !disabled,
    },
    {
      "hover:text-gray-700": !disabled,
      "bg-gray-50 text-gray-300": disabled,
    }
  );
  const inputClassNames = clsx(
    "peer focus:outline-none focus:ring-0 bg-transparent px-2 py-2 h-full",
    {
      "placeholder:text-gray-400": !errors,
      "group-hover:placeholder:text-gray-700 group-hover:focus:placeholder:text-gray-400 ":
        !disabled,
    }
  );

  const labelClassNames = clsx(
    "text-sm ml-2 px-[1px] peer-focus:text-blue-500",
    {
      "text-gray-400 peer-focus:text-blue-500 group-hover:text-gray-700":
        !errors && !disabled,
      "text-error-500 peer-focus:text-error-500": errors && !disabled,
    }
  );

  return (
    <div className={clsx("inline-block")}>
      <fieldset
        className={clsx(
          "grid grid-cols-[auto_1fr_auto] group pb-2",
          parentClassNames,
          className
        )}
      >
        <div className="flex items-center">
          {addOn && addOnPosition === "left" && addOn}
        </div>
        <input
          {...register}
          {...restProps}
          className={clsx(inputClassNames)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={errors ? "true" : "false"}
        />
        <div className="flex items-center">
          {addOn && addOnPosition === "right" && addOn}
        </div>
        <legend className={labelClassNames}>
          {label} {required && <span className="text-error-500">*</span>}
        </legend>
      </fieldset>
      {helperText && <p className="mt-2 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
});
