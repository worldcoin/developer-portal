import cn from "classnames";
import { Icon } from "src/common/Icon";
import { memo, ReactNode } from "react";
import { text } from "src/common/styles";

export const Checkbox = memo(function Checkbox(props: {
  checked: boolean;
  className?: string;
  disabled?: boolean;
  iconClassName?: string;
  label: ReactNode;
  labelClassName?: string;
  name?: string;
  onChange?: (checked: boolean) => void;
  size?: "default" | "small";
}) {
  const { size = "default" } = props;

  return (
    <label
      className={cn(
        text.caption,
        "grid grid-cols-auto/1fr gap-x-4 leading-5 cursor-pointer",
        props.className
      )}
    >
      <input
        className="sr-only peer"
        type="checkbox"
        checked={props.checked}
        onChange={(e) => !props.disabled && props.onChange?.(e.target.checked)}
        disabled={props.disabled}
      />
      <Icon
        className={cn(
          "hidden peer-checked:block text-neutral-dark",
          {
            "w-[30px] h-[30px]": size === "default",
            "w-3.5 h-3.5": size === "small",
          },
          props.iconClassName
        )}
        name="checkbox-on"
      />
      <Icon
        className={cn(
          "block peer-checked:hidden",
          {
            "w-[30px] h-[30px]": size === "default",
            "w-3.5 h-3.5": size === "small",
          },
          props.iconClassName
        )}
        name="checkbox"
      />
      <span
        className={cn(
          "min-h-[30px] grid items-center select-none",
          props.labelClassName
        )}
      >
        {props.label}
      </span>
    </label>
  );
});
