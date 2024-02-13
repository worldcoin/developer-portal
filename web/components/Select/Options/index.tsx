import { selectContext } from "@/components/Select";
import { FloatingPortal } from "@floating-ui/react";
import { Listbox, ListboxOptionsProps, Transition } from "@headlessui/react";
import { Fragment, useContext } from "react";
import { twMerge } from "tailwind-merge";

type SelectOptionsProps = Omit<ListboxOptionsProps<"ul">, "className"> & {
  className?: string;
};

export const SelectOptions = (props: SelectOptionsProps) => {
  const { className } = props;
  const { setFloating, floatingStyles } = useContext(selectContext);
  return (
    <FloatingPortal>
      <div
        ref={setFloating}
        style={floatingStyles}
        className="z-[100] flex flex-col"
      >
        <Transition
          enter="transition duration-300 ease-out"
          enterFrom="transform opacity-0"
          enterTo="transform opacity-100"
          leave="transition duration-150 ease-out"
          leaveFrom="transform opacity-100"
          leaveTo="transform opacity-0"
          as={Fragment}
        >
          <Listbox.Options
            className={twMerge(
              "min-h-0 overflow-y-auto rounded-12 border border-grey-200 bg-grey-0 py-1 shadow-lg",
              className,
            )}
          >
            {props.children}
          </Listbox.Options>
        </Transition>
      </div>
    </FloatingPortal>
  );
};
