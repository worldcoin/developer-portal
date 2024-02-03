import { Menu, MenuButtonProps } from "@headlessui/react";
import { useContext } from "react";
import { dropdownContext } from "@/components/Dropdown";
import { twMerge } from "tailwind-merge";

type DropdownButtonProps = Omit<MenuButtonProps<"button">, "className"> & {
  className?: string;
};

export const DropdownButton = (props: DropdownButtonProps) => {
  const { className, ...otherProps } = props;
  const { setReference } = useContext(dropdownContext);
  return (
    <Menu.Button
      ref={setReference}
      className={twMerge(className)}
      {...otherProps}
    />
  );
};
