import { Menu, MenuItemsProps, Transition } from "@headlessui/react";
import { FloatingPortal } from "@floating-ui/react";
import { useContext, Fragment } from "react";
import { dropdownContext } from "@/components/DropdownOld";
import { twMerge } from "tailwind-merge";

type DropdownItemsProps = Omit<MenuItemsProps<"ul">, "className"> & {
  className?: string;
};

export const DropdownItems = (props: DropdownItemsProps) => {
  const { className } = props;
  const { setFloating, floatingStyles } = useContext(dropdownContext);
  return (
    <FloatingPortal>
      <div
        ref={setFloating}
        style={floatingStyles}
        className="z-[1] flex flex-col"
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
          <Menu.Items
            className={twMerge(
              "min-h-0 overflow-y-auto rounded-12 border border-grey-100 bg-grey-0 py-1 shadow-lg",
              className,
            )}
          >
            {props.children}
          </Menu.Items>
        </Transition>
      </div>
    </FloatingPortal>
  );
};
