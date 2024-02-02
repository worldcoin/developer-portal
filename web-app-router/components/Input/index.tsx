"use client";
import clsx from "clsx";
import { InputHTMLAttributes, memo } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { twMerge } from "tailwind-merge";

interface InputInterface extends InputHTMLAttributes<HTMLInputElement> {
  register?: UseFormRegisterReturn;
  required?: boolean;
  currentValue?: string;
  errors?: FieldError;
  label: string;
  placeholder?: string;
  helperText?: string;
  addOnLeft?: React.ReactElement;
  addOnRight?: React.ReactElement;
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
    addOnLeft,
    addOnRight,
    disabled,
    ...restProps
  } = props;

  const parentClassNames = clsx(
    "border-[1px] text-grey-700 rounded-lg bg-grey-0 px-2 text-sm",
    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700 ":
        !errors && !disabled,
      "border-system-error-500 text-system-error-500 focus-within:border-system-error-500":
        errors && !disabled,
    },
    {
      "hover:text-grey-700": !disabled,
      "bg-grey-50 text-grey-300 border-grey-200": disabled,
    }
  );
  const inputClassNames = clsx(
    "peer focus:outline-none focus:ring-0 bg-transparent px-2 py-2 h-full",
    {
      "placeholder:text-grey-400": !errors,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-grey-400 ":
        !disabled,
    }
  );

  const labelClassNames = clsx("text-sm ml-2 peer-focus:text-blue-500", {
    "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700":
      !errors && !disabled,
    "text-system-error-500 peer-focus:text-system-error-500":
      errors && !disabled,
    "text-grey-400": disabled,
    "px-0": label == "",
    "px-0.5": label != "",
  });

  return (
    <div className={"inline-grid font-gta w-full"}>
      <fieldset
        className={twMerge(
          clsx("grid grid-cols-auto/1fr/auto group pb-2", parentClassNames),
          typeof className === "string" ? className : undefined
        )}
      >
        <div className="flex items-center">{addOnLeft && addOnLeft}</div>

        <input
          {...register}
          {...restProps}
          className={clsx(inputClassNames)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={errors ? "true" : "false"}
        />

        <div className="flex items-center">{addOnRight && addOnRight}</div>

        <legend className={labelClassNames}>
          {label} {required && <span className="text-system-error-500">*</span>}
        </legend>
      </fieldset>
      <div className={clsx("flex flex-col w-full px-2")}>
        {helperText && (
          <p className="mt-2 text-xs text-grey-500">{helperText}</p>
        )}
        {errors?.message && (
          <p className="mt-2 text-xs text-system-error-500">{errors.message}</p>
        )}
      </div>
    </div>
  );
});
