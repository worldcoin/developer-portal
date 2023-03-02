import { Icon, IconType } from "src/components/Icon";
import { memo } from "react";
import cn from "classnames";

export const StatusIcon = memo(function StatusIcon(props: {
  icon: IconType;
  iconClassname?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid relative rounded-full w-[80px] h-[80px] bg-primary-light",
        "overflow-hidden flex justify-center items-center",
        props.className
      )}
    >
      <Icon
        className={cn("w-10 h-10 text-primary", props.iconClassname)}
        name={props.icon}
      />
    </span>
  );
});
