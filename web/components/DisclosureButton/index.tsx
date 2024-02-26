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
        "flex  w-full border-grey-100 bg-grey-50 ",
        { "rounded-t-xl border-l border-r border-t": isOpen },
        { "rounded-xl border hover:bg-grey-100": !isOpen },
        props.className,
      )}
    >
      {props.children}
    </Disclosure.Button>
  );
};
