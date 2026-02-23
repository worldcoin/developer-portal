"use client";
import clsx from "clsx";
import { InputHTMLAttributes } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  register?: UseFormRegisterReturn;
  label: React.ReactNode;
  errors?: FieldError;
  id: string;
}

export const FloatingInput = ({
  register,
  label,
  errors,
  id,
  className,
  ...restProps
}: FloatingInputProps) => {
  return (
    <div className="grid gap-y-1">
      <div
        className={clsx(
          "relative rounded-xl px-4 pb-3 pt-7",
          errors ? "bg-system-error-50" : "bg-grey-50",
          className,
        )}
      >
        <input
          id={id}
          {...register}
          {...restProps}
          placeholder=" "
          className="peer w-full bg-transparent text-sm text-grey-900 focus:outline-none"
        />
        <label
          htmlFor={id}
          className={clsx(
            "pointer-events-none absolute left-4 transition-all duration-150",
            "top-1/2 -translate-y-1/2 text-sm",
            "peer-focus:top-4 peer-focus:translate-y-0 peer-focus:text-xs",
            "peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs",
            errors ? "text-system-error-500" : "text-grey-500",
          )}
        >
          {label}
        </label>
      </div>

      {errors?.message && (
        <p className="px-1 text-xs text-system-error-500">{errors.message}</p>
      )}
    </div>
  );
};
