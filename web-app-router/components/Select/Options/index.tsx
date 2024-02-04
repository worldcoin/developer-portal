import { Listbox, ListboxOptionsProps, Transition } from "@headlessui/react";
import { FloatingPortal } from "@floating-ui/react";
import { useContext, Fragment } from "react";
import { selectContext } from "@/components/Select";
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
              "min-h-0 py-1 bg-grey-0 border border-grey-200 rounded-12 shadow-lg overflow-y-auto",
              className
            )}
          >
            {props.children}
          </Listbox.Options>
        </Transition>
      </div>
    </FloatingPortal>
  );
};
