import {
  ChangeEvent,
  InputHTMLAttributes,
  memo,
  ReactNode,
  useCallback,
} from "react";
import cn from "classnames";
import { Icon } from "src/common/Icon";

interface CheckboxInterface extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export const Checkbox = memo(function Checkbox(props: CheckboxInterface) {
  const { className, label, disabled, value, onChange, ...otherProps } = props;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!disabled && onChange) {
        onChange(e);
      }
    },
    [disabled, onChange]
  );

  return (
    <label
      className={cn(
        className,
        "grid grid-cols-auto/1fr gap-x-4 leading-5 cursor-pointer text-neutral-secondary"
      )}
    >
      <input
        className="sr-only peer"
        {...otherProps}
        type="checkbox"
        onChange={handleChange}
      />
      <Icon
        className={cn("block peer-checked:hidden w-6 h-6")}
        name="checkbox"
      />
      <Icon
        className={cn("hidden peer-checked:block w-6 h-6")}
        name="checkbox-on"
      />
      <span
        className={cn(
          "min-h-[30px] grid items-center select-none text-14 leading-5"
        )}
      >
        {label}
      </span>
    </label>
  );
});
