import { memo, useCallback } from "react";
import cn from "classnames";
import { Icon, IconType } from "common/Icon";

export interface OptionProps {
  icon: IconType;
  title: string;
  description: string;
  easiest?: boolean;
  checked: boolean;
  onCheckedChange: () => void;
}

export const Option = memo(function Option(props: OptionProps) {
  const { icon, title, description, easiest, checked, onCheckedChange } = props;

  const handleClick = useCallback(() => {
    onCheckedChange();
  }, [onCheckedChange]);

  return (
    <button
      className={cn(
        "relative flex items-center gap-x-4 w-full p-4 pr-5 text-left border rounded-2xl",
        {
          "bg-191c20 border-transparent": props.checked,
          "border-f0edf9": !props.checked,
        }
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "shrink-0 flex items-center justify-center w-12 h-12 rounded-full",
          {
            "bg-ffffff/10 text-ffffff": checked,
            "bg-f3f4f5": !checked,
          }
        )}
      >
        <Icon name={icon} className="w-6 h-6" />
      </div>

      <div>
        <div
          className={cn("font-sora font-semibold text-16 leading-4", {
            "text-ffffff": checked,
            "text-191c20": !checked,
          })}
        >
          {title}
        </div>

        <div
          className={cn("mt-1.5 font-rubik text-14 leading-4", {
            "text-ffffff/60": checked,
            "text-neutral": !checked,
          })}
        >
          {description}
        </div>
      </div>

      {easiest && (
        <div
          className={cn(
            "absolute top-[8px] right-[8px] flex items-center h-6 px-3 font-rubik text-14 leading-[1px] rounded-lg",
            {
              "bg-ffffff/10 text-ffffff": checked,
              "bg-f3f4f5": !checked,
            }
          )}
        >
          Easiest
        </div>
      )}
    </button>
  );
});
