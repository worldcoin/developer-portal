import {
  Dialog,
  DialogPanelProps as DialogPanelPropsBase,
} from "@headlessui/react";
import { twMerge } from "tailwind-merge";

type DialogPanelProps = Omit<DialogPanelPropsBase<"div">, "className"> & {
  className?: string;
};

export const DialogPanel = (props: DialogPanelProps) => {
  const { className, children, ...otherProps } = props;

  return (
    <Dialog.Panel
      className={twMerge(
        "relative grid min-w-[25rem] justify-items-center rounded-20 bg-grey-0 p-7",
        className,
      )}
      {...otherProps}
    >
      {children}
    </Dialog.Panel>
  );
};
