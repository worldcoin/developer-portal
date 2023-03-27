import cn from "classnames";
import { memo } from "react";
import { Icon, IconType } from "src/components/Icon";

interface IllustrationInterface {
  className?: string;
  color?: "primary" | "success" | "danger" | "warning";
  icon: IconType;
}

export const Illustration = memo(function Illustration(
  props: IllustrationInterface
) {
  const { className, color = "primary", icon } = props;

  return (
    <div
      className={cn(
        className,
        "grid items-center justify-center w-[88px] h-[88px] rounded-full",
        { "bg-primary-light": color === "primary" },
        { "bg-success-light": color === "success" },
        { "bg-danger-light": color === "danger" },
        { "bg-warning-light": color === "warning" }
      )}
    >
      <div className="relative flex">
        <Icon
          className={cn(
            "w-10 h-10",
            { "text-primary": color === "primary" },
            { "text-success": color === "success" },
            { "text-danger": color === "danger" },
            { "text-warning": color === "warning" }
          )}
          name={icon}
        />

        <div className="absolute top-[10px] left-0 blur-xl">
          <Icon
            className={cn(
              "w-10 h-10",
              { "text-primary/50": color === "primary" },
              { "text-success/50": color === "success" },
              { "text-danger/50": color === "danger" },
              { "text-warning/50": color === "warning" }
            )}
            name={icon}
          />
        </div>

        {color === "success" && (
          <Icon
            className="absolute -top-[190px] -left-[190px] w-[420px] h-[420px]"
            name="success-illustration"
            noMask
          />
        )}
        {color === "warning" && (
          <Icon
            className="absolute -top-[190px] -left-[136px] w-[420px] h-[420px]"
            name="warning-illustration"
            noMask
          />
        )}
      </div>
    </div>
  );
});
