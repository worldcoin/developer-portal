import { Disclosure } from "@headlessui/react";
import clsx from "clsx";

export const DisclosureButton = (props: {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}) => {
  const { isOpen } = props;
  return (
    <Disclosure.Button
      className={clsx(
        "bg-grey-50  border-grey-100 w-full flex ",
        { "rounded-t-xl border-t border-r border-l": isOpen },
        { "rounded-xl border hover:bg-grey-100": !isOpen },
        props.className,
      )}
    >
      {props.children}
    </Disclosure.Button>
  );
};
