import { Listbox, ListboxOptionProps } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

type SelectOptionProps<T> = Omit<ListboxOptionProps<"li", T>, "className"> & {
  className?: string;
};

export const SelectOption = <T,>(props: SelectOptionProps<T>) => {
  const { className, ...otherProps } = props;
  return (
    <Listbox.Option
      as="li"
      className={twMerge(
        "cursor-pointer px-4 py-2.5 leading-5 data-[headlessui-state*=selected]:text-grey-400",
        className,
      )}
      {...otherProps}
    >
      {props.children}
    </Listbox.Option>
  );
};
