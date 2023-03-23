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
        "relative flex items-center gap-x-4 w-full py-4 pl-4 pr-3.5 text-left border rounded-2xl transition-colors",
        {
          "bg-neutral-dark border-transparent": props.checked,
          "border-f0edf9": !props.checked,
        }
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      <div
        className={cn(
          "shrink-0 flex items-center justify-center w-12 h-12 rounded-full transition-colors",
          {
            "bg-ffffff/10": checked,
            "bg-f3f4f5": !checked,
          }
        )}
      >
        <Icon
          name={icon}
          className={cn("w-6 h-6 transition-colors", {
            "text-ffffff": checked,
            "text-neutral-dark": !checked,
          })}
        />
      </div>

      <div>
        <div
          className={cn(
            "font-sora font-semibold text-16 leading-4 transition-colors",
            {
              "text-ffffff": checked,
              "text-neutral-dark": !checked,
            }
          )}
        >
          {title}
        </div>

        <div
          className={cn(
            "mt-1.5 font-rubik text-14 leading-4 transition-colors",
            {
              "text-ffffff/60": checked,
              "text-neutral": !checked,
            }
          )}
        >
          {description}
        </div>
      </div>

      {easiest && (
        <div
          className={cn(
            "absolute top-2 right-4 flex items-center h-6 px-3 font-rubik text-14 leading-[1px] rounded-lg transition-colors",
            {
              "bg-ffffff/10 text-ffffff": checked,
              "bg-neutral-dark/10 text-neutral-dark": !checked,
            }
          )}
        >
          Easiest
        </div>
      )}
    </button>
  );
});
