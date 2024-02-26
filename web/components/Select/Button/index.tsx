import { selectContext } from "@/components/Select";
import { Listbox, ListboxButtonProps } from "@headlessui/react";
import { useContext } from "react";
import { twMerge } from "tailwind-merge";

type SelectButtonProps<T> = Omit<ListboxButtonProps<"button">, "className"> & {
  className?: string;
};

export const SelectButton = <T,>(props: SelectButtonProps<T>) => {
  const { className, ...otherProps } = props;
  const { setReference } = useContext(selectContext);
  return (
    <Listbox.Button
      ref={setReference}
      className={twMerge("px-4 leading-5", className)}
      {...otherProps}
    />
  );
};
