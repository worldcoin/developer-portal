"use client";
import clsx from "clsx";
import { FloatingLabel } from "flowbite-react";
import { ComponentProps, InputHTMLAttributes, memo } from "react";
import { Icon } from "../Icon";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface InputInterface extends InputHTMLAttributes<HTMLInputElement> {
  register: UseFormRegisterReturn;
  currentValue?: string;
  errors?: FieldError;
  isDirty?: boolean;
  label: string;
  placeholder?: string;
  helperText?: string;
  className?: string;
}

export const Input = memo(function Input(props: InputInterface) {
  const {
    register,
    helperText,
    label,
    placeholder,
    className,
    required,
    disabled,
    errors,
    ...restProps
  } = props;

  const customTheme = {
    input: {
      default: {
        outlined: {
          md: clsx(
            "border-1 peer block w-full appearance-none rounded-lg border-gray-200 bg-transparent px-4 py-4 text-sm placeholder:text-gray-400",
            "focus:border-blue-500 focus:text-gray-700 focus:outline-none focus:ring-0",
            "disabled:bg-gray-50 disabled:text-gray-300"
            // Adjust right padding when canCopy is true
          ),
        },
      },
    },
    label: {
      default: {
        outlined: {
          md: clsx(
            "absolute left-4 top-2 z-10 origin-[0] -translate-y-4 scale-75 transition-transform bg-white px-1 text-sm duration-300 scale-75 -translate-y-4",
            "text-gray-400 peer-focus:text-blue-500",
            disabled && [
              "before:content-[''] before:absolute before:inset-0 before:bg-white before:z-[-1] before:rounded-lg before:w-full before:h-full",
              "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:bg-gray-50 after:z-[-1] after:rounded-b-lg after:w-full after:h-1/2",
              "bg-transparent",
            ],
            {
              "after:content-['*'] after:text-error-500 after:pl-1": required,
            }
          ),
        },
      },
    },
    helperText: {
      default: "mt-2 text-xs text-gray-500 ",
    },
  };

  return (
    <div className={clsx(className, "relative")}>
      <FloatingLabel
        label={label}
        {...register}
        {...restProps}
        theme={customTheme}
        variant="outlined"
        sizing="md"
        helperText={helperText}
        placeholder={placeholder}
        disabled={disabled}
        required={true}
        aria-invalid={errors ? "true" : "false"}
      ></FloatingLabel>
      {/* {canCopy && (
        <button
          type="button"
          disabled={disabled}
          className="absolute inset-y-0 right-0 top-4 flex pr-3.5"
        >
          <Icon
            name="copy"
            aria-hidden="true"
            className={clsx(
              "h-5 w-5 hover:text-gray-900",
              disabled && "text-gray-300"
            )}
          />
        </button>
      )} */}
    </div>
  );
});
