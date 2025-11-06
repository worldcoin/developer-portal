import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import {
  Dialog,
  DialogPanelProps as DialogPanelPropsBase,
  Transition,
} from "@headlessui/react";
import { Fragment, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type DialogPanelProps = Omit<DialogPanelPropsBase<"div">, "className"> & {
  className?: string;
  contentClassName?: string;
  showCloseIcon?: boolean;
  onClose?: () => void;
  children?: ReactNode;
};

export const DialogPanel = (props: DialogPanelProps) => {
  const { className, children, showCloseIcon, onClose, ...otherProps } = props;

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
            showCloseIcon && "pt-[78px]",
            className,
          )}
          {...otherProps}
        >
          {showCloseIcon && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-7 top-7 flex size-8 items-center justify-center rounded-full bg-grey-100 transition-colors hover:bg-grey-200 focus:outline-none focus:ring-grey-300"
              aria-label="Close dialog"
            >
              <RemoveCustomIcon className="size-4" />
            </button>
          )}
          {children}
        </Dialog.Panel>
      </div>
    </Transition.Child>
  );
};
