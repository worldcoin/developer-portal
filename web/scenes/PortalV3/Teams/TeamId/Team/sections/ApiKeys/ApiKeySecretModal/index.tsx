"use client";

import {
  FormDialog,
  formDialogPrimaryActionClassName,
} from "@/components/FormDialog";
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
    <FormDialog
      open={isOpen}
      onClose={onClose}
      closeLabel="Close API key dialog"
      title={title}
      panelClassName="max-h-[calc(100dvh-2rem)] md:w-[544px] md:max-w-[calc(100vw-2rem)]"
      bodyClassName="min-h-0 overflow-y-auto"
    >
      <div className="grid w-full gap-y-5">
        <p className="font-world text-14 leading-[1.5] text-portal-muted">
          {description}
        </p>

        {apiKey && (
          <>
            <ApiKeySecretFields apiKey={apiKey} />

            <button
              type="button"
              className={formDialogPrimaryActionClassName}
              onClick={onClose}
            >
              Done
            </button>
          </>
        )}
      </div>
    </FormDialog>
  );
};
