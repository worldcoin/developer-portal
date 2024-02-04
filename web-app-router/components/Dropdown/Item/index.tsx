import { Menu, MenuItemProps } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

type DropdownItemProps = Omit<MenuItemProps<"button">, "className"> & {
  className?: string;
};

export const DropdownItem = (props: DropdownItemProps) => {
  const { className, ...otherProps } = props;
  return (
    <Menu.Item
      className={twMerge(
        "px-4 py-2.5 leading-5 text-14 cursor-pointer",
        className,
      )}
      {...otherProps}
    >
      {props.children}
    </Menu.Item>
  );
};
