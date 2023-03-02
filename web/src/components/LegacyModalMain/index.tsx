// FIXME: deprecated, remove after refactoring
import cn from "classnames";
import { memo, ReactNode } from "react";

export const ModalMain = memo(function ModalMain(props: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <main className={cn("py-5 px-8", props.className)}>{props.children}</main>
  );
});
