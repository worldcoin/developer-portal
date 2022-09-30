import cn from "classnames";
import { memo, ReactNode } from "react";

export const ModalWindow = memo(function ModalWindow(props: {
  close?: () => void;
  handleReturn?: () => void;
  classNames?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("w-fit z-60 rounded-xl bg-ffffff", props.classNames)}>
      {props.children}
    </div>
  );
});
