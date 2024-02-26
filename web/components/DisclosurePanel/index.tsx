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
        "flex w-full rounded-b-xl border-grey-100 bg-grey-50",
        { "border-b border-l border-r": isOpen },
        { "rounded-xl border": !isOpen },
        props.className,
      )}
    >
      {props.children}
    </Disclosure.Panel>
  );
};
