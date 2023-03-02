import { Icon } from "src/components/Icon";
import { memo } from "react";
import cn from "classnames";

export const ModalWindowHeader = memo(function ModalWindowHeader(props: {
  title: string;
  displayCloseButton?: boolean;
  displayReturnButton?: boolean;
  close?: () => void;
  handleReturn?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-flow-col justify-between items-center max-w-[512px] w-screen h-16",
        "border-b border-neutral-muted text-20 text-neutral-dark",
        props.className,
        {
          "pr-6": !props.displayCloseButton,
          "pl-6": !props.displayReturnButton,
        }
      )}
    >
      <div className="grid grid-flow-col items-center h-full gap-x-5">
        {props.displayReturnButton && (
          <button
            className="grid justify-center items-center h-full pl-6"
            onClick={props.handleReturn}
          >
            <Icon name="arrow-right" className="w-6 h-6 rotate-180" />
          </button>
        )}
        <span>{props.title}</span>
      </div>
      <div className="grid grid-flow-col h-full gap-x-5">
        {props.displayCloseButton && (
          <button
            className="grid justify-center items-center h-full pr-6"
            onClick={props.close}
          >
            <Icon name="plus" className="w-6 h-6 text-primary rotate-45" />
          </button>
        )}
      </div>
    </div>
  );
});
