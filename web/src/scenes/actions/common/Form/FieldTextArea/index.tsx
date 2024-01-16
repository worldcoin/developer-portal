import { TextareaHTMLAttributes, memo } from "react";
import cn from "classnames";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FieldTextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  register: UseFormRegisterReturn;
  errors?: FieldError;
  isDirty?: boolean;
  value?: string;
  maxChar?: number; // New prop for maximum characters
}

export const FieldTextArea = memo(function FieldTextArea(
  props: FieldTextAreaProps
) {
  const {
    className,
    register,
    errors,
    value = "",
    isDirty,
    maxChar,
    disabled,
    ...otherProps
  } = props;
  // Calculate the characters left
  const charsLeft = maxChar ? maxChar - value.length : undefined;

  return (
    <div className="w-full ">
      <textarea
        {...register}
        disabled={disabled}
        className={cn(
          className,
          "flex items-center h-24 p-4 text-neutral-primary outline-0 border-2 rounded-xl focus:shadow-input focus:bg-ffffff",
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
