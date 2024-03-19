import { Fragment, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { twMerge } from "tailwind-merge";

type ListItemTextProps = {
  asChild?: boolean;
  className?: string;
  children: ReactNode;
};

export const ListItemText = (props: ListItemTextProps) => {
  const { asChild, className, children, ...otherProps } = props;
  const Component = asChild ? Slot : "div";
  return (
    <Component
      className={twMerge(
        "max-md:truncate max-md:text-lg md:whitespace-nowrap md:text-sm md:!leading-[1px]",
        className,
      )}
      {...otherProps}
    >
      {children}
    </Component>
  );
};
