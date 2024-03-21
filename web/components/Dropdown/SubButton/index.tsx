import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { twMerge } from "tailwind-merge";

type SubButtonProps = DropdownPrimitive.DropdownMenuSubTriggerProps & {};

export const SubButton = (props: SubButtonProps) => {
  const { className, children, ...otherProps } = props;

  return (
    <DropdownPrimitive.SubTrigger
      className={twMerge(
        "grid cursor-pointer grid-cols-auto/1fr items-center gap-x-4 px-2 py-2.5 hover:bg-grey-50 md:gap-x-2 md:px-4",
        className,
      )}
      {...otherProps}
      onPointerMove={(event) => event.preventDefault()}
      onPointerLeave={(event) => event.preventDefault()}
    >
      {children}
    </DropdownPrimitive.SubTrigger>
  );
};
