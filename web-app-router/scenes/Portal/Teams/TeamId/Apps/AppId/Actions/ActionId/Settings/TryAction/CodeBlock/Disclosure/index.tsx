import { Disclosure } from "@headlessui/react";
import React from "react";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { MinusIcon } from "@/components/Icons/MinusIcon";
import { DisclosureButton } from "@/components/DisclosureButton";
import { DisclosurePanel } from "@/components/DisclosurePanel";

type DisclosureProps = {
  buttonText: string;
  panelText: string;
};
export const DisclosureComponent = (props: DisclosureProps) => {
  const { buttonText, panelText } = props;

  return (
    <div className="w-full max-w-full">
      <Disclosure>
        {({ open }) => (
          <>
            <DisclosureButton isOpen={open}>
              <div className="w-full justify-between flex px-8 py-5 items-center">
                <p className="font-[550]">{buttonText}</p>
                {open ? (
                  <MinusIcon className="h-4 w-4 text-grey-900" />
                ) : (
                  <PlusIcon className="h-3 w-3 text-grey-900" />
                )}
              </div>
            </DisclosureButton>
            <DisclosurePanel
              className="text-gray-500 w-full px-8 "
              isOpen={open}
            >
              <div>{panelText}</div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </div>
  );
};
