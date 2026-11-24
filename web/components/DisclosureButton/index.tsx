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
        "flex w-full border-edge-subtle bg-surface-soft",
        { "rounded-t-xl border-t border-r border-l": isOpen },
        { "rounded-xl border hover:bg-surface-muted": !isOpen },
        props.className,
      )}
    >
      {props.children}
    </Disclosure.Button>
  );
};
