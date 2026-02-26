"use client";
import clsx from "clsx";
import { InputHTMLAttributes, ReactNode } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  register?: UseFormRegisterReturn;
  label?: React.ReactNode;
  errors?: FieldError;
  id: string;
  required?: boolean;
  addOnRight?: ReactNode;
}

export const FloatingInput = ({
  register,
  label,
  errors,
  id,
  required,
  addOnRight,
  className,
  ...restProps
}: FloatingInputProps) => {
  // Force label to floated position when a static value is provided (e.g. disabled fields)
  const hasStaticValue = Boolean(restProps.value || restProps.defaultValue);

  return (
    <div className="grid gap-y-1">
      <div
        className={clsx(
          "relative flex items-center gap-2 rounded-[10px] px-4",
          label ? "pb-3 pt-7" : "py-3.5",
          errors ? "bg-system-error-50" : "bg-grey-50",
          className,
        )}
      >
        <input
          id={id}
          {...register}
          placeholder=" "
          {...restProps}
          className="peer w-full min-w-0 flex-1 bg-transparent text-sm text-grey-900 focus:outline-none disabled:text-grey-700 disabled:opacity-100 disabled:[-webkit-text-fill-color:#3C424B]"
        />
        {label && (
          <label
            htmlFor={id}
            className={clsx(
              "pointer-events-none absolute left-4 transition-all duration-150",
              errors ? "text-system-error-500" : "text-grey-500",
              hasStaticValue
                ? "top-4 translate-y-0 text-xs"
                : [
                    "top-1/2 -translate-y-1/2 text-sm",
                    "peer-focus:top-4 peer-focus:translate-y-0 peer-focus:text-xs",
                    "peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs",
                  ],
            )}
          >
            {label}
            {required && (
              <span className="ml-0.5 text-system-error-500">*</span>
            )}
          </label>
        )}
        {addOnRight && (
          <div className="relative z-10 shrink-0">{addOnRight}</div>
        )}
      </div>

      {errors?.message && (
        <p className="px-1 text-xs text-system-error-500">{errors.message}</p>
      )}
    </div>
  );
};
