import {
  Dialog,
  DialogPanelProps as DialogPanelPropsBase,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react";
import { twMerge } from "tailwind-merge";

type DialogPanelProps = Omit<DialogPanelPropsBase<"div">, "className"> & {
  className?: string;
};

export const DialogPanel = (props: DialogPanelProps) => {
  const { className, children, ...otherProps } = props;

  return (
    <Transition.Child
      enter="transition duration-300 ease"
      enterFrom="opacity-0 translate-y-full md:translate-y-0 md:scale-90"
      enterTo="opacity-100 translate-y-0 md:scale-100"
      leave="transition duration-150 ease"
      leaveFrom="opacity-100 translate-y-0 md:scale-100"
      leaveTo="opacity-0 translate-y-full md:translate-y-0 md:scale-90"
      as={Fragment}
    >
      <div className="fixed inset-0 grid items-end overflow-y-auto p-5 md:items-center md:justify-center">
        <Dialog.Panel
          className={twMerge(
            "relative z-50 grid w-full justify-items-center rounded-32 bg-grey-0 p-7 md:w-auto md:min-w-[25rem] md:rounded-20",
            className,
          )}
          {...otherProps}
        >
          {children}
        </Dialog.Panel>
      </div>
    </Transition.Child>
  );
};
