import { Fragment } from "react";
import { Transition } from "@headlessui/react";

export const DialogOverlay = () => {
  return (
    <Transition.Child
      enter="transition duration-300 ease"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition duration-150 ease"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      as={Fragment}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[15px]" />
    </Transition.Child>
  );
};
