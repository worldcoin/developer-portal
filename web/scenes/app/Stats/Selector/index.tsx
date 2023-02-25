import { Fragment, memo, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Icon } from "common/Icon";

export type Option = { label: string; value: string };

export const Selector = memo(function Selector(props: {
  options: Array<Option>;
}) {
  const [selected, setSelected] = useState<Option>(props.options[0]);

  return (
    <div>
      <Menu>
        <div>
          <span className="text-[18px]">{selected?.label}</span>
          <Menu.Button>
            <div className="w-4 h-4 flex justify-center items-center">
              <Icon name="angle-down" className="w-2.5 h-2.5" />
            </div>
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        ></Transition>
      </Menu>
    </div>
  );
});
