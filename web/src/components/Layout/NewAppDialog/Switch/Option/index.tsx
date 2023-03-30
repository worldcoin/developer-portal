import { memo, useCallback } from "react";
import cn from "classnames";
import { Icon, IconType } from "src/components/Icon";

export interface OptionProps {
  icon: IconType;
  title: string;
  description: string;
  easiest?: boolean;
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
}

export const Option = memo(function Option(props: OptionProps) {
  const {
    icon,
    title,
    description,
    easiest,
    checked,
    onCheckedChange,
    disabled,
  } = props;

  const handleClick = useCallback(() => {
    onCheckedChange();
  }, [onCheckedChange]);

  return (
    <button
      type="button"
      className={cn(
        "relative flex items-center gap-x-4 w-full py-4 pl-4 pr-3.5 text-left rounded-[10px] transition-colors",
        {
          "bg-ffffff": props.checked,
          "bg-transparent": !props.checked,
        }
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      <div
        className={cn(
          "shrink-0 flex items-center justify-center w-12 h-12 rounded-full transition-colors",
          {
            "bg-f3f4f5": checked,
            "bg-ffffff opacity-50": !checked,
          }
        )}
      >
        <Icon
          name={icon}
          className={cn("w-6 h-6 transition-colors text-neutral-dark", {
            "opacity-50": !checked,
          })}
        />
      </div>

      <div>
        <div
          className={cn("font-sora font-semibold text-16 leading-4 transition-colors text-neutral-dark", {
            "opacity-50": !checked,
          })}
        >
          {title}
        </div>

        <div
          className={cn("mt-1.5 font-rubik text-14 leading-4 transition-colors text-neutral", {
            "opacity-50": !checked,
          })}
        >
          {description}
        </div>
      </div>

      {easiest && (
        <div
          className={cn("absolute top-1 right-1 flex items-center h-6 px-3 font-rubik text-14 leading-[1px] rounded-[6px] transition-colors text-neutral-dark", {
            "bg-ebecef": checked,
            "bg-ffffff opacity-50": !checked,
          })}
        >
          Easiest
        </div>
      )}
    </button>
  );
});
