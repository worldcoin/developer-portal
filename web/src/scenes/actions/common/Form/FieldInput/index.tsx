import { InputHTMLAttributes, memo } from "react";
import cn from "classnames";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  register: UseFormRegisterReturn;
  errors?: FieldError;
  isDirty?: boolean;
  value?: string;
  maxChar?: number; // New prop for maximum characters
}

export const FieldInput = memo(function FieldInput(props: FieldInputProps) {
  const {
    className,
    register,
    errors,
    value = "",
    isDirty,
    maxChar,
    ...otherProps
  } = props;
  // Calculate the characters left
  const charsLeft = maxChar ? maxChar - value?.length : 0;

  return (
    <div>
      <input
        {...register}
        className={cn(
          className,
          "flex items-center h-12 px-4 text-neutral-primary outline-0 border-2 rounded-xl focus:shadow-input focus:bg-ffffff",
          {
            "placeholder-neutral-secondary bg-f3f4f5 border-f1f5f8 focus:bg-ffffff focus:border-ebecef":
              !isDirty && !errors,
          },
          { "bg-ffffff border-d6d9dd": isDirty && !errors },
          { "bg-fff0ed border-ff6848 focus:border-ff6848": errors }
        )}
        aria-invalid={errors ? "true" : "false"}
        {...otherProps}
      />
      {maxChar && (
        <span className="text-neutral-secondary text-sm">
          {charsLeft} characters left
        </span>
      )}
    </div>
  );
});
