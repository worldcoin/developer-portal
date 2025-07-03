"use client";
import clsx from "clsx";
import { TextareaHTMLAttributes, memo } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { twMerge } from "tailwind-merge";

export interface TextAreaInterface
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  register: UseFormRegisterReturn;
  required?: boolean;
  currentValue?: string;
  errors?: FieldError;
  label: React.ReactNode;
  placeholder?: string;
  helperText?: string;
  addOn?: React.ReactElement;
  topAddOn?: React.ReactElement;
  className?: string;
  rows?: number;
  enableResize?: boolean;
  chunk?: boolean;
}

export const TextArea = memo(function TextArea(props: TextAreaInterface) {
  const {
    register,
    required,
    helperText,
    label,
    placeholder,
    className,
    errors,
    addOn,
    topAddOn,
    disabled,
    rows,
    enableResize = true,
    chunk = false,
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
      "bg-grey-50 text-grey-400 border-grey-200": disabled,
    },
  );
  const inputClassNames = clsx(
    "peer h-full bg-transparent p-2 focus:outline-none focus:ring-0",
    {
      "placeholder:text-grey-400": !errors,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-grey-400 ":
        !disabled,
      "resize-none": !enableResize,
    },
  );

  const labelClassNames = clsx(
    "ml-2 whitespace-nowrap px-[2px] text-sm peer-focus:text-blue-500",
    {
      "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700":
        !errors && !disabled,
      "text-system-error-500 peer-focus:text-system-error-500":
        errors && !disabled,
      "text-grey-400": disabled,
      "px-0": label === "",
    },
  );

  return (
    <div className={"inline-grid w-full font-gta"}>
      <fieldset
        className={twMerge(
          clsx("group relative grid pb-2", parentClassNames),
          typeof className === "string" ? className : undefined,
        )}
      >
        <textarea
          {...register}
          {...restProps}
          rows={rows}
          className={clsx(inputClassNames)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={errors ? "true" : "false"}
        />

        <div className="absolute inset-y-0 bottom-3 right-2 flex items-end pr-2">
          {addOn && addOn}
        </div>

        {topAddOn && (
          <div className="absolute inset-y-0 right-2 top-3">{topAddOn}</div>
        )}

        <legend className={labelClassNames}>
          {label} {required && <span className="text-system-error-500">*</span>}
        </legend>
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
