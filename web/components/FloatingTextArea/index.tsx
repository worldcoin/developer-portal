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
          "relative rounded-[10px] px-4 pb-3 pt-7",
          errors ? "bg-system-error-50" : "bg-grey-50",
          className,
        )}
      >
        <textarea
          id={id}
          {...register}
          {...restProps}
          placeholder=" "
          className="peer w-full resize-none bg-transparent text-sm text-grey-900 focus:outline-none disabled:text-grey-700 disabled:opacity-100 disabled:[-webkit-text-fill-color:#3C424B]"
        />
        {addOnRight && (
          <div className="absolute bottom-3 right-4 z-10">{addOnRight}</div>
        )}
        <label
          htmlFor={id}
          className={clsx(
            "pointer-events-none absolute left-4 transition-all duration-150",
            errors ? "text-system-error-500" : "text-grey-500",
            hasStaticValue
              ? "top-4 translate-y-0 text-xs"
              : [
                  "top-7 translate-y-0 text-sm",
                  "peer-focus:top-4 peer-focus:text-xs",
                  "peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-xs",
                ],
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-system-error-500">*</span>}
        </label>
      </div>

      {errors?.message && (
        <p className="px-1 text-xs text-system-error-500">{errors.message}</p>
      )}
    </div>
  );
};
