// FIXME: deprecated, remove after refactoring
import cn from "classnames";
import { memo, ReactNode } from "react";
import { Icon } from "src/common/Icon";
import { text } from "src/common/styles";

export const ModalHeader = memo(function ModalHeader(props: {
  className?: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <header
      className={cn(
        "flex justify-between w-full items-center border-b border-neutral-muted p-5",
        props.className
      )}
    >
      <h1 className={cn(text.h2, "leading-6")}>{props.children}</h1>
      {props.onClose && (
        <button className="block w-6 h-6" onClick={props.onClose}>
          <Icon name="close" className="w-6 h-6 text-primary cursor-pointer" />
        </button>
      )}
    </header>
  );
});
