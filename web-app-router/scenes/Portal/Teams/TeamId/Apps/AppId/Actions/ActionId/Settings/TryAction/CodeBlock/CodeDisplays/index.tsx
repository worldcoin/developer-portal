import { Disclosure } from "@headlessui/react";
import React, { useCallback } from "react";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { MinusIcon } from "@/components/Icons/MinusIcon";
import { DisclosureButton } from "@/components/DisclosureButton";
import { DisclosurePanel } from "@/components/DisclosurePanel";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { Button } from "@/components/Button";
import { toast } from "react-toastify";
import { CodeBlock } from "@/components/CodeBlock";

type CodeDisplayComponentProps = {
  buttonText: string;
  panelText: string;
};

export const CodeDisplayComponent = (props: CodeDisplayComponentProps) => {
  const { buttonText, panelText } = props;
  const copyAction = useCallback(() => {
    navigator.clipboard.writeText(panelText);
    toast.success("Copied to clipboard");
  }, [panelText]);

  return (
    <div className="w-full">
      <Disclosure as="div">
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
              className="text-gray-500 px-8 pb-4 max-w-full"
              isOpen={open}
            >
              <div className="w-full justify-items-end grid">
                <CodeBlock
                  code={panelText}
                  language="javascript"
                  theme={"neutral"}
                  className="text-xs text-grey-700 w-full "
                />
                <Button
                  type="button"
                  onClick={copyAction}
                  className="flex gap-x-2 pt-2 text-grey-400 hover:text-grey-900"
                >
                  <CopyIcon className="h-4 w-4" />
                  <p className="text-xs ">Copy</p>
                </Button>
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </div>
  );
};
