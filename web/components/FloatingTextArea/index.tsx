"use client";
import clsx from "clsx";
import { ReactNode, TextareaHTMLAttributes } from "react";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FloatingTextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  register?: UseFormRegisterReturn;
  label: React.ReactNode;
  errors?: FieldError;
  id: string;
  required?: boolean;
  addOnRight?: ReactNode;
}

export const FloatingTextArea = ({
  register,
  label,
  errors,
  id,
  required,
  addOnRight,
  className,
  ...restProps
}: FloatingTextAreaProps) => {
  const hasStaticValue = Boolean(restProps.value || restProps.defaultValue);

  return (
    <div className="grid gap-y-1">
      <div
        className={clsx(
          "relative rounded-[10px] px-4 pt-7 pb-3",
          errors ? "bg-surface-error-50" : "bg-surface-soft",
          className,
        )}
      >
        <textarea
          id={id}
          {...register}
          {...restProps}
          placeholder=" "
          className="peer w-full resize-none bg-transparent text-sm text-content-primary focus:outline-hidden disabled:text-content-strong disabled:opacity-100 disabled:[-webkit-text-fill-color:var(--content-strong)]"
        />
        {addOnRight && (
          <div className="absolute right-4 bottom-3 z-10">{addOnRight}</div>
        )}
        <label
          htmlFor={id}
          className={clsx(
            "pointer-events-none absolute left-4 transition-all duration-150",
            errors ? "text-content-error-500" : "text-content-secondary",
            hasStaticValue
              ? "top-4 translate-y-0 text-xs"
              : [
                  "top-7 translate-y-0 text-sm",
                  "peer-focus:top-4 peer-focus:text-xs",
                  "peer-not-placeholder-shown:top-4 peer-not-placeholder-shown:text-xs",
                ],
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-content-error-500">*</span>}
        </label>
      </div>

      {errors?.message && (
        <p className="px-1 text-xs text-content-error-500">{errors.message}</p>
      )}
    </div>
  );
};
