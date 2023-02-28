import { memo } from "react";
import cn from "classnames";
import { Icon, IconType } from "common/Icon";

interface DialogHeaderProps {
  className?: string;
  icon: IconType;
  iconColor?: "primary";
}

export const DialogHeaderIcon = memo(function DialogHeaderIcon(
  props: DialogHeaderProps
) {
  const { className, icon, iconColor = "primary" } = props;

  return (
    <div
      className={cn(
        className,
        "flex items-center justify-center w-full h-full rounded-full",
        { "bg-primary-light": iconColor === "primary" }
      )}
    >
      <div className={cn("relative flex")}>
        <Icon
          className={cn("w-8 h-8", {
            "text-primary": iconColor === "primary",
          })}
          name={icon}
        />

        <div className="absolute top-[10px] left-0 blur-xl">
          <Icon
            className={cn("w-8 h-8", {
              "text-primary/50": iconColor === "primary",
            })}
            name={icon}
          />
        </div>
      </div>
    </div>
  );
});
