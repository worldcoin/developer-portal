import { Fragment, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { twMerge } from "tailwind-merge";

type ListItemIconProps = {
  asChild?: boolean;
  className?: string;
  children: ReactNode;
};

export const ListItemIcon = (props: ListItemIconProps) => {
  const { asChild, className, children, ...otherProps } = props;
  const Component = asChild ? Slot : Fragment;
  return (
    <Component
      className={twMerge("size-6 text-grey-400 md:size-4", className)}
      {...otherProps}
    >
      {children}
    </Component>
  );
};
