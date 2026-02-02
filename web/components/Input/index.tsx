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
  label?: React.ReactNode;
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
    "rounded-lg border-[1px] bg-grey-0 px-2 text-base text-grey-700 md:text-sm",

    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700 ":
        !errors && !disabled,
      "border-system-error-500 text-system-error-500 focus-within:border-system-error-500":
        errors && !disabled,
    },

    {
      "hover:text-grey-700": !disabled,
      "bg-grey-25 text-grey-400 border-grey-200": disabled,
    },
  );
  const inputClassNames = clsx(
    "peer h-full min-w-0 bg-transparent p-2 transition-colors placeholder:transition-colors focus:outline-none focus:ring-0",

    {
      "placeholder:text-grey-400": !errors,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-grey-400 ":
        !disabled,
    },
  );

  const labelClassNames = clsx("ml-2 text-sm peer-focus:text-blue-500", {
    "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700":
      !errors && !disabled,
    "text-system-error-500 peer-focus:text-system-error-500":
      errors && !disabled,
    "text-grey-400": disabled,
    "px-0": label == "",
    "px-0.5": label != "",
  });

  return (
    <div className={"inline-grid w-full font-gta transition-colors"}>
      <fieldset
        className={twMerge(
          clsx(
            "group grid grid-cols-auto/1fr/auto pb-2 transition-colors",
            { "py-2": !label },
            parentClassNames,
          ),

          typeof className === "string" ? className : undefined,
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

        {label && (
          <legend
            className={twMerge(
              clsx("select-none whitespace-nowrap", labelClassNames),
            )}
          >
            {label}{" "}
            {required && <span className="text-system-error-500">*</span>}
          </legend>
        )}
      </fieldset>

      <div className={clsx("flex w-full flex-col px-2")}>
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
