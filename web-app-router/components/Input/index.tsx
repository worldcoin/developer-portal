"use client";
import clsx from "clsx";
import { FloatingLabel } from "flowbite-react";
import { ComponentProps, InputHTMLAttributes, memo } from "react";
import { Icon } from "../Icon";
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
// It's easier to pass in disabled and required as props instead of through register. This doesn't recognize yup required anyways
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
  const { ...restRegister } = register;
  const customTheme = {
    input: {
      default: {
        outlined: {
          md: clsx(
            "border-1 peer block w-full appearance-none rounded-lg border-gray-200 bg-transparent px-4 py-4 text-sm placeholder:text-gray-400",
            "focus:border-blue-500 focus:text-gray-700 focus:outline-none focus:ring-0",
            { "bg-gray-50 disabled:text-gray-300": disabled },
            {
              "hover:border-gray-700 peer-hover:text-gray-700": !disabled,
            },
            { "pl-12": addOnPosition === "left" },
            { "pr-12": addOnPosition === "right" }
          ),
        },
      },
      error: {
        outlined: {
          md: clsx(
            "border-1 text-error-500 peer block w-full appearance-none rounded-lg border-error-500 bg-transparent px-4 py-4 text-sm placeholder:text-error-500",
            "focus:border-error-500 focus:text-gray-700 focus:outline-none focus:ring-0",
            "disabled:bg-gray-50 disabled:text-gray-300"
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
            {
              "after:content-['*'] after:text-error-500 after:pl-1 ": required,
            },
            {
              "before:content-[''] before:absolute before:inset-0 before:bg-white before:z-[-1] before:rounded-lg before:w-full before:h-full after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:bg-gray-50 after:z-[-1] after:rounded-b-lg after:w-full after:h-1/2 bg-transparent":
                disabled,
            }
          ),
        },
      },
      error: {
        outlined: {
          md: clsx(
            "absolute left-4 top-2 z-10 origin-[0] -translate-y-4 scale-75 transition-transform bg-white px-1 text-sm duration-300 scale-75 -translate-y-4",
            "text-error-500 peer-focus:text-error-500",
            {
              "after:content-['*'] after:text-error-500 after:pl-1": required,
            },
            disabled && [
              "before:content-[''] before:absolute before:inset-0 before:bg-white before:z-[-1] before:rounded-lg before:w-full before:h-full",
              "after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:bg-gray-50 after:z-[-1] after:rounded-b-lg after:w-full after:h-1/2",
              "bg-transparent",
            ]
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
      {addOn && addOnPosition === "left" && (
        <div className="absolute inset-y-0 left-4 top-0 flex pr-3.5">
          {addOn}
        </div>
      )}{" "}
      <FloatingLabel
        label={label}
        theme={customTheme}
        {...restProps}
        {...restRegister}
        variant="outlined"
        sizing="md"
        helperText={helperText}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        color={errors ? "error" : "default"}
        aria-invalid={errors ? "true" : "false"}
      />
      {addOn && addOnPosition === "right" && addOn}
    </div>
  );
});
