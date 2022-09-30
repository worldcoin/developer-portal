import { memo, ReactNode } from "react";
import cn from "classnames";

export const ModalWindowSection = memo(function ModalWindowSection(props: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-8 pb-8", props.className)}>{props.children}</div>
  );
});
