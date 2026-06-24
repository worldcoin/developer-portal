import { ReactNode } from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { twMerge } from "tailwind-merge";

type DisabledListItemProps = DropdownPrimitive.DropdownMenuItemProps & {
  icon?: ReactNode;
  description?: ReactNode;
};

export const DisabledListItem = (props: DisabledListItemProps) => {
  const { className, children, icon, description, ...otherProps } = props;

  return (
    <DropdownPrimitive.Item
      {...otherProps}
      disabled
      aria-disabled="true"
      className={twMerge(
        "grid cursor-not-allowed grid-cols-auto/1fr items-start gap-x-4 px-2 py-2.5 text-start text-grey-300 outline-none md:gap-x-2 md:px-4",
        className,
      )}
    >
      {icon ? <span className="[&>svg]:size-5">{icon}</span> : null}
      <span className="grid gap-y-0.5">
        <span>{children}</span>
        {description ? (
          <span className="text-12 leading-4 text-grey-400">{description}</span>
        ) : null}
      </span>
    </DropdownPrimitive.Item>
  );
};
