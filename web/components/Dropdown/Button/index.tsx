import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { twMerge } from "tailwind-merge";

type ButtonProps = DropdownPrimitive.DropdownMenuTriggerProps & {};

export const Button = (props: ButtonProps) => {
  const { className, children, ...otherProps } = props;
  return (
    <DropdownPrimitive.Trigger
      className={twMerge(
        "grid cursor-pointer items-center md:gap-x-2",
        className,
      )}
      {...otherProps}
    >
      {children}
    </DropdownPrimitive.Trigger>
  );
};
