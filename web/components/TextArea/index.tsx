"use client";
import clsx from "clsx";
import { TextareaHTMLAttributes, memo } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { twMerge } from "tailwind-merge";

export interface TextAreaInterface
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  register?: UseFormRegisterReturn;
  required?: boolean;
  currentValue?: string;
  errors?: FieldError;
  label?: React.ReactNode;
  placeholder?: string;
  helperText?: string;
  addOn?: React.ReactElement;
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
    disabled,
    rows,
    enableResize = true,
    chunk = false,
    ...restProps
  } = props;

  const parentClassNames = clsx(
    "rounded-lg border bg-surface px-2 text-base text-content-strong md:text-sm",
    {
      "border-edge focus-within:border-focus focus-within:hover:border-focus hover:border-edge-heavy ":
        !errors && !disabled,
      "border-edge-error-500 text-content-error-500 focus-within:border-edge-error-500":
        errors && !disabled,
    },
    {
      "hover:text-content-strong": !disabled,
      "bg-surface-soft text-content-tertiary border-edge": disabled,
    },
  );
  const inputClassNames = clsx(
    "peer h-full bg-transparent p-2 focus:outline-hidden focus:ring-0",
    {
      "placeholder:text-content-tertiary": !errors,
      "group-hover:placeholder:text-content-strong focus:group-hover:placeholder:text-content-tertiary ":
        !disabled,
      "resize-none": !enableResize,
    },
  );

  const labelClassNames = clsx(
    "ml-2 whitespace-nowrap px-[2px] text-sm peer-focus:text-content-link-legacy",
    {
      "text-content-tertiary peer-focus:text-content-link-legacy group-hover:text-content-strong":
        !errors && !disabled,
      "text-content-error-500 peer-focus:text-content-error-500":
        errors && !disabled,
      "text-content-tertiary": disabled,
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

        <div className="absolute inset-y-0 right-2 bottom-3 flex items-end pr-2">
          {addOn && addOn}
        </div>

        {(Boolean(label) || required) && (
          <legend className={labelClassNames}>
            {label}
            {required && <span className="text-content-error-500">*</span>}
          </legend>
        )}
      </fieldset>
      <div className={clsx("flex w-full flex-col px-2")}>
        {helperText && (
          <p className="mt-2 text-xs text-content-secondary">{helperText}</p>
        )}
        {errors?.message && (
          <p className="mt-2 text-xs text-content-error-500">
            {errors.message}
          </p>
        )}
      </div>
    </div>
  );
});
