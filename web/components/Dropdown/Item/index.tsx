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
        "cursor-pointer px-4 py-2.5 text-14 leading-5",
        className,
      )}
      {...otherProps}
    >
      {props.children}
    </Menu.Item>
  );
};
