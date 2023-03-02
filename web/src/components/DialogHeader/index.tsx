import { memo } from "react";
import cn from "classnames";
import { Icon, IconType } from "src/components/Icon";

interface DialogHeaderProps {
  className?: string;
  icon: IconType;
  iconColor?: "primary";
  title: string;
}

export const DialogHeader = memo(function DialogHeader(
  props: DialogHeaderProps
) {
  const { className, icon, iconColor = "primary" } = props;

  return (
    <div className={cn(className, "flex flex-col items-center")}>
      <div
        className={cn(
          "grid items-center justify-center w-[88px] h-[88px] rounded-full",
          { "bg-primary-light": iconColor === "primary" }
        )}
      >
        <div className="relative flex">
          <Icon
            className={cn("w-10 h-10", {
              "text-primary": iconColor === "primary",
            })}
            name={icon}
          />

          <div className="absolute top-[10px] left-0 blur-xl">
            <Icon
              className={cn("w-10 h-10", {
                "text-primary/50": iconColor === "primary",
              })}
              name={icon}
            />
          </div>
        </div>
      </div>

      <h1 className="pt-6 pb-8 font-sora font-semibold text-24 leading-7">
        {props.title}
      </h1>
    </div>
  );
});
