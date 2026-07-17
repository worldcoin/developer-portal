import {
  Dialog as DialogBase,
  type DialogProps as DialogPropsBase,
  Transition,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { Fragment } from "react";

export type DialogProps = DialogPropsBase<"div"> & {
  afterLeave?: () => void;
};

export const Dialog = (props: DialogProps) => {
  const { afterLeave, className, children, open, ...otherProps } = props;

  return (
    <Transition show={open} afterLeave={afterLeave} as={Fragment}>
      <DialogBase
        className={twMerge(
          "fixed inset-0 z-50",
          typeof className === "string" ? className : undefined,
        )}
        {...otherProps}
      >
        {children}
      </DialogBase>
    </Transition>
  );
};
