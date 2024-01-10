import {
  ChangeEvent,
  InputHTMLAttributes,
  memo,
  ReactNode,
  useCallback,
} from "react";
import cn from "classnames";
import { Icon } from "src/components/Icon";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";

interface CheckboxInterface extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  register: UseFormRegisterReturn;
  errors?: FieldError;
  isDirty?: boolean;
  alternativeColor?: string;
}

export const Checkbox = memo(function Checkbox(props: CheckboxInterface) {
  const {
    className,
    label,
    disabled,
    value,
    register,
    errors,
    isDirty,
    alternativeColor,
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
        className="sr-only peer"
        {...otherProps}
        type="checkbox"
      />
      <Icon
        className={cn(
          "block peer-checked:hidden w-6 h-6",
          { "text-danger": errors },
          alternativeColor ? alternativeColor : { "text-gray-400": !errors }
        )}
        name="checkbox"
      />
      <Icon
        className={cn(
          "hidden peer-checked:block w-6 h-6",
          { "text-danger": errors },
          alternativeColor ? alternativeColor : { "text-gray-400": !errors }
        )}
        name="checkbox-on"
      />
      <span
        className={cn(
          "min-h-[30px] grid items-center select-none text-14 leading-5 text-gray-400"
        )}
      >
        {label}
      </span>
    </label>
  );
});
