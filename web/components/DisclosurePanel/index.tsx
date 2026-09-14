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
        "flex w-full rounded-b-xl border-edge-subtle bg-surface-soft",
        { "border-r border-b border-l": isOpen },
        { "rounded-xl border": !isOpen },
        props.className,
      )}
    >
      {props.children}
    </Disclosure.Panel>
  );
};
