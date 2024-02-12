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
        "relative grid justify-items-center p-7 bg-grey-0 rounded-20 min-w-[25rem]",
        className,
      )}
      {...otherProps}
    >
      {children}
    </Dialog.Panel>
  );
};
