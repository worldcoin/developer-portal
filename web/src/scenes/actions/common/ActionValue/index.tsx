import { memo } from "react";
import cn from "classnames";

export const ActionValue = memo(function ActionValue(props: {
  className?: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex px-1.5 py-1 font-ibm text-12 text-danger leading-[10px] bg-f9fafb border border-ebecef rounded",
        props.className
      )}
    >
      {props.value}
    </div>
  );
});
