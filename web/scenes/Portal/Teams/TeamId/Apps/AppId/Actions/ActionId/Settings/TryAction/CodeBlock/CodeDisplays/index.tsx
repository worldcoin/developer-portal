"use client";
import { Button } from "@/components/Button";
import { CodeBlock } from "@/components/CodeBlock";
import { DisclosureButton } from "@/components/DisclosureButton";
import { DisclosurePanel } from "@/components/DisclosurePanel";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { MinusIcon } from "@/components/Icons/MinusIcon";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Disclosure } from "@headlessui/react";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { useCallback } from "react";
import { toast } from "react-toastify";

type CodeDisplayComponentProps = {
  buttonText: string;
  panelText: string;
  type: string;
};

export const CodeDisplayComponent = (props: CodeDisplayComponentProps) => {
  const { buttonText, panelText, type } = props;
  const params = useParams();

  const copyAction = useCallback(() => {
    navigator.clipboard.writeText(panelText);
    toast.success("Copied to clipboard");

    posthog.capture("code_copied", {
      app_id: params?.appId,
      team_id: params?.teamId,
      action_id: params?.actionId,
      type: type,
    });
  }, [panelText, params, type]);

  return (
    <div className="w-full">
      <Disclosure as="div">
        {({ open }) => (
          <>
            <DisclosureButton isOpen={open}>
              <div className="flex w-full items-center justify-between px-8 py-5">
                <p className="font-[550]">{buttonText}</p>
                {open ? (
                  <MinusIcon className="size-4 text-grey-900" />
                ) : (
                  <PlusIcon className="size-3 text-grey-900" />
                )}
              </div>
            </DisclosureButton>
            <DisclosurePanel
              className="max-w-full px-8 pb-4 text-gray-500"
              isOpen={open}
            >
              <div className="grid w-full justify-items-end">
                <CodeBlock
                  code={panelText}
                  language="javascript"
                  theme={"neutral"}
                  className="w-full text-xs text-grey-700 "
                />
                <Button
                  type="button"
                  onClick={copyAction}
                  className="flex gap-x-2 pt-2 text-grey-400 hover:text-grey-900"
                >
                  <CopyIcon className="size-4" />
                  <Typography variant={TYPOGRAPHY.R5} className="text-xs">
                    Copy
                  </Typography>
                </Button>
              </div>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </div>
  );
};

