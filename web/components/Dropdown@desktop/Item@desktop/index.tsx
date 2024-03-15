import { Menu } from "@headlessui/react";
import { useContext } from "react";
import { twMerge } from "tailwind-merge";
import { ItemProps } from "@/components/Dropdown/Item";
import { dropdownDesktopContext } from "components/Dropdown@desktop";

export const Item = (props: ItemProps) => {
  const { className, ...otherProps } = props;
  const {} = useContext(dropdownDesktopContext);
  return (
    <Menu.Item
      className={twMerge(
        "cursor-pointer whitespace-nowrap px-4 py-2.5 font-gta text-14 leading-5 hover:bg-grey-50",
        className,
      )}
      {...otherProps}
      as="div"
    >
      {props.children}
    </Menu.Item>
  );
};

export default Item;
