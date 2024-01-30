import { Disclosure } from "@headlessui/react";
import clsx from "clsx";

export const DisclosurePanel = (props: {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}) => {
  const { isOpen } = props;
  return (
    <Disclosure.Panel
      className={clsx(
        "bg-grey-50 border-grey-100 w-full flex rounded-b-xl",
        { "border-b border-r border-l": isOpen },
        { "rounded-xl border": !isOpen },
        props.className
      )}
    >
      {props.children}
    </Disclosure.Panel>
  );
};
