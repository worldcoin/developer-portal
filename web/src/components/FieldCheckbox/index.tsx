import {
  ChangeEvent,
  forwardRef,
  InputHTMLAttributes,
  memo,
  useCallback,
} from "react";
import cn from "classnames";

interface FieldCheckboxInterface extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const FieldCheckbox = memo(
  forwardRef<HTMLInputElement, FieldCheckboxInterface>(function FieldCheckbox(
    {
      className,
      invalid,
      checked,
      onChange,
      ...otherProps
    }: FieldCheckboxInterface,
    ref
  ) {
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
          onChange(e);
        }
      },
      [onChange]
    );

    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          className,
          "form-checkbox h-6 w-6 text-blue-600 rounded border-gray-300 focus:ring-blue-500",
          { "border-red-600 text-red-600 focus:ring-red-500": invalid }
        )}
        checked={checked}
        onChange={handleChange}
        aria-invalid={invalid ? "true" : "false"}
        {...otherProps}
      />
    );
  })
);
