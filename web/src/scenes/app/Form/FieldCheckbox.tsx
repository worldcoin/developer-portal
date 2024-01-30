import { InputHTMLAttributes, memo, ReactNode } from "react";
import cn from "classnames";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface CheckboxInterface extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  register: UseFormRegisterReturn;
  errors?: FieldError;
  isDirty?: boolean;
  alternativeColor?: string;
}

export const FieldCheckbox = memo(function FieldCheckbox(
  props: CheckboxInterface
) {
  const {
    className,
    label,
    disabled,
    value,
    register,
    errors,
    isDirty,
    ...otherProps
  } = props;

  return (
    <label
      className={cn(
        className,
        "grid grid-cols-auto/1fr gap-x-4 leading-5 cursor-pointer "
      )}
    >
      <input
        {...register}
        disabled={disabled}
        className={cn("h-6 w-6 accent-blue-primary")}
        {...otherProps}
        type="checkbox"
      />

      <span
        className={cn(
          "min-h-[30px] grid items-center select-none text-14 leading-5 text-gray-500"
        )}
      >
        {label}
      </span>
    </label>
  );
});
