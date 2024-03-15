import { Dialog } from "@headlessui/react";
import { Fragment, useContext } from "react";
import { twMerge } from "tailwind-merge";
import { ItemsProps } from "@/components/Dropdown/Items";
import { Transition } from "@headlessui/react";
import { dropdownMobileContext } from "components/Dropdown@mobile";

export const Items = (props: ItemsProps) => {
  const { className, children } = props;
  const { open, setOpen } = useContext(dropdownMobileContext)!;
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={() => setOpen(false)} className="fixed inset-0 z-50">
        <Transition.Child
          enter="transition duration-300 ease"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition duration-150 ease"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          as={Fragment}
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <Transition.Child
          enter="transition duration-300 ease"
          enterFrom="opacity-0 translate-y-full"
          enterTo="opacity-100 translate-y-0"
          leave="transition duration-150 ease"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-full"
          as={Fragment}
        >
          <div className="fixed inset-0 grid items-end overflow-y-auto">
            <Dialog.Panel
              className={twMerge(
                "relative z-50 grid w-full gap-y-1 rounded-t-20 bg-grey-0 p-7",
                className,
              )}
            >
              {children}
            </Dialog.Panel>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};

export default Items;
