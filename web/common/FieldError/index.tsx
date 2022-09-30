import cn from "classnames";
import { memo, ReactNode } from "react";

export const FieldError = memo(function FieldError(props: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("text-14 text-warning", props.className)}>
      {props.children}
    </div>
  );
});
