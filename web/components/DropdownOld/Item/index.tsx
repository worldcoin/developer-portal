import { Menu, MenuItemProps } from "@headlessui/react";
import { ElementType } from "react";
import { twMerge } from "tailwind-merge";

type DropdownItemProps<TTag extends ElementType> = Omit<
  MenuItemProps<TTag>,
  "className"
> & {
  className?: string;
};

export const DropdownItem = <TTag extends ElementType>(
  props: DropdownItemProps<TTag>,
) => {
  const { className, ...otherProps } = props;
  return (
    <Menu.Item
      className={twMerge(
        "cursor-pointer px-4 py-2.5 text-14 leading-5",
        className,
      )}
      {...otherProps}
    >
      {props.children}
    </Menu.Item>
  );
};
