"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
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

      <DialogPanel className="md:max-w-[36rem]">
        <div className="grid grid-cols-1 justify-items-center gap-y-10">
          <CircleIconContainer variant={"info"}>
            <KeyIcon className="text-blue-500" />
          </CircleIconContainer>

          <div className="grid w-full justify-items-center gap-y-4">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              {title}
            </Typography>

            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              {description}
            </Typography>
          </div>

          {apiKey && (
            <div className="grid w-full gap-y-10">
              <ApiKeySecretFields apiKey={apiKey} />

              <DecoratedButton type="button" onClick={onClose}>
                Done
              </DecoratedButton>
            </div>
          )}
        </div>
      </DialogPanel>
    </Dialog>
  );
};
