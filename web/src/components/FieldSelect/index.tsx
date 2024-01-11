import { memo, ReactNode, InputHTMLAttributes, useState } from "react";
import cn from "classnames";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface SelectInterface extends InputHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  register: UseFormRegisterReturn;
  options: { value: string; label: string }[];
  errors?: FieldError;
  invalid?: boolean;
}

export const FieldSelect = memo(function Select(props: SelectInterface) {
  const {
    className,
    label,
    value,
    register,
    options,
    errors,
    invalid,
    ...otherProps
  } = props;
  const [isEmpty, setIsEmpty] = useState<boolean>(!value);

  return (
    <select
      {...register}
      className={cn(
        className,
        "flex items-center h-10 mt-2 px-4 text-neutral-primary outline-0 border-2 rounded-xl ",
        {
          "placeholder-neutral-secondary bg-f3f4f5 border-f1f5f8 focus:bg-ffffff focus:border-ebecef":
            isEmpty && !invalid,
        }
      )}
      {...otherProps}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
