import { useContext } from "react";
import { twMerge } from "tailwind-merge";
import { ItemProps } from "@/components/Dropdown/Item";
import { dropdownMobileContext } from "components/Dropdown@mobile";

export const Item = (props: ItemProps) => {
  const { className, children } = props;
  const { onClose } = useContext(dropdownMobileContext)!;
  return (
    <div
      className={twMerge(
        "w-full cursor-pointer px-2 py-2.5 text-18",
        className,
      )}
      onClick={(event) => {
        event.stopPropagation();
        if (!props.preventCloseOnClick) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
};

export default Item;
