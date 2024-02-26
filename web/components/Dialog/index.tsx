import {
  Dialog as DialogBase,
  type DialogProps as DialogPropsBase,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";

export type DialogProps = DialogPropsBase<"div">;

export const Dialog = (props: DialogProps) => {
  const { className, children, ...otherProps } = props;

  return (
    <DialogBase
      className={twMerge(
        "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto",
        typeof className === "string" ? className : undefined,
      )}
      {...otherProps}
    >
      {children}
    </DialogBase>
  );
};
