import cn from "classnames";
import { memo, ReactNode } from "react";
import { Icon } from "@/components/Icon";

export const FieldError = memo(function FieldError(props: {
  className?: string;
  message: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-x-2 items-center font-rubik text-12 text-ff6848 leading-3",
        props.className
      )}
    >
      <Icon name="warning-error" className="w-4 h-4" />
      {props.message}
    </div>
  );
});
