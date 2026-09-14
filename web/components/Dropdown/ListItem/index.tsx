import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { twMerge } from "tailwind-merge";

type ListItemProps = DropdownPrimitive.DropdownMenuItemProps & {};

export const ListItem = (props: ListItemProps) => {
  const { className, children, ...otherProps } = props;

  return (
    <DropdownPrimitive.Item
      className={twMerge(
        "grid cursor-pointer grid-cols-auto-1fr-auto items-center gap-x-4 px-2 py-2.5 text-start outline-hidden transition-colors hover:bg-portal-border focus:bg-portal-border data-[highlighted]:bg-portal-border md:gap-x-2 md:px-4",
        className,
      )}
      {...otherProps}
    >
      {children}
    </DropdownPrimitive.Item>
  );
};
