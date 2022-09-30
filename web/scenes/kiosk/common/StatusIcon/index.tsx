import { Icon, IconType } from "common/Icon";
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
        "grid relative rounded-full w-[60px] h-[60px] box-content border-[20px] border-f1f5f8 dark:border-neutral-dark bg-000000",
        "overflow-hidden before:absolute before:inset-0 before:[clip-path:inset(0_0_0_50%)] before:bg-gradient-to-t",
        "before:from-[#5743d6] before:to-[#f66751]"
      )}
    >
      <Icon
        className={cn("absolute inset-3 text-ffffff", props.iconClassname)}
        name={props.icon}
      />
    </span>
  );
});
