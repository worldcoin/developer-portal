import { InputHTMLAttributes, memo } from "react";
import cn from "classnames";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface FieldTextAreaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  register: UseFormRegisterReturn;
  errors?: FieldError;
  isDirty?: boolean;
}

export const FieldTextArea = memo(function FieldTextArea(
  props: FieldTextAreaProps
) {
  const { className, register, errors, isDirty, ...otherProps } = props;

  return (
    <textarea
      {...register}
      className={cn(
        className,
        "flex items-center h-12 p-4 text-neutral-primary outline-0 border-2 rounded-xl focus:shadow-input min-h-[128px]",
        {
          "placeholder-neutral-secondary bg-f3f4f5 border-f1f5f8 focus:bg-ffffff focus:border-ebecef":
            !isDirty && !errors,
        },
        { "bg-ffffff border-d6d9dd": props.isDirty && !errors },
        { "bg-fff0ed border-ff6848 focus:border-ff6848": errors }
      )}
      {...otherProps}
    />
  );
});
