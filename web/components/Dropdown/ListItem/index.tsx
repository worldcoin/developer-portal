import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { twMerge } from "tailwind-merge";

type ListItemProps = DropdownPrimitive.DropdownMenuItemProps & {};

export const ListItem = (props: ListItemProps) => {
  const { className, children, ...otherProps } = props;

  return (
    <DropdownPrimitive.Item
      className={twMerge(
        "grid grid-cols-auto/1fr/auto items-center gap-x-4 px-2 py-2.5 text-start text-lg !leading-[1px] outline-none hover:bg-grey-50 md:gap-x-2 md:px-4 md:text-sm",
        className,
      )}
      {...otherProps}
    >
      {children}
    </DropdownPrimitive.Item>
  );
};
