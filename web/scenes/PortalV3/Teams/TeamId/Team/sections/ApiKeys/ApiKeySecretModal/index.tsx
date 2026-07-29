"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ApiKeySecretFields } from "../ApiKeySecretFields";

export const ApiKeySecretModal = (props: {
  apiKey: string | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}) => {
  const { apiKey, isOpen, onClose, title, description } = props;

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogOverlay />

      <DialogPanel className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-20 p-5 sm:p-6 md:w-136 md:max-w-[calc(100vw-2rem)]">
        <div className="grid grid-cols-1 justify-items-center gap-y-5">
          <div className="flex size-12 items-center justify-center rounded-full border border-blue-150 bg-blue-50 text-blue-500">
            <KeyIcon className="size-5" />
          </div>

          <div className="grid w-full justify-items-center gap-y-2 text-center">
            <Typography variant={TYPOGRAPHY.H5} className="text-grey-900">
              {title}
            </Typography>

            <Typography
              variant={TYPOGRAPHY.R3}
              className="max-w-[24rem] text-grey-500"
            >
              {description}
            </Typography>
          </div>

          {apiKey && (
            <div className="grid w-full gap-y-5">
              <ApiKeySecretFields apiKey={apiKey} />

              <DecoratedButton
                type="button"
                className="min-h-11"
                onClick={onClose}
              >
                Done
              </DecoratedButton>
            </div>
          )}
        </div>
      </DialogPanel>
    </Dialog>
  );
};
