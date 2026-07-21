import {
  Dialog as DialogBase,
  type DialogProps as DialogPropsBase,
  Transition,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";
import { Fragment } from "react";

export type DialogProps = DialogPropsBase<"div"> & {
  afterLeave?: () => void;
  // Opt-in: animate the enter transition on initial mount. Off by default so
  // existing always-mounted dialogs are unaffected; used by dialogs that are
  // lazy-mounted already open, which would otherwise pop in without animating.
  appear?: boolean;
};

export const Dialog = (props: DialogProps) => {
  const { afterLeave, appear, className, children, open, ...otherProps } =
    props;

  return (
    <Transition
      show={open}
      appear={appear}
      afterLeave={afterLeave}
      as={Fragment}
    >
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
