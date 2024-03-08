import {
  Dialog as DialogBase,
  type DialogProps as DialogPropsBase,
  Transition,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { Fragment } from "react";

export type DialogProps = DialogPropsBase<"div">;

export const Dialog = (props: DialogProps) => {
  const { className, children, open, ...otherProps } = props;

  return (
    <Transition show={open} as={Fragment}>
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
