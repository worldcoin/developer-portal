import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Dialog } from "@headlessui/react";
import { JSONEditor } from "./json-editor";
import { JSONFileUpload } from "./json-file-upload";

type ImportExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  jsonInput: string;
  onJsonInputChange: (value: string) => void;
  validationError?: string | null;
  onFileUpload: (file: File) => Promise<void>;
  onApplyChanges: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  hasChanges?: boolean;
};

export const ImportExportDialog = ({
  isOpen,
  onClose,
  jsonInput,
  onJsonInputChange,
  validationError,
  onFileUpload,
  onApplyChanges,
  disabled,
  isLoading,
  hasChanges,
}: ImportExportDialogProps) => {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogOverlay />
      <DialogPanel className="grid gap-y-6 md:max-w-[50rem]">
        <div className="grid w-full grid-cols-1fr/auto justify-between gap-x-2">
          <Typography variant={TYPOGRAPHY.H6}>
            Import/Export localisations JSON
          </Typography>
          <Button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200"
          >
            <CloseIcon className="size-4" />
          </Button>
        </div>

        <JSONEditor
          value={jsonInput}
          onChange={onJsonInputChange}
          error={validationError}
          disabled={disabled}
        />

        <JSONFileUpload
          onFileUpload={onFileUpload}
          disabled={disabled}
          isLoading={isLoading}
        />

        <div className="flex justify-end gap-x-3">
          <DecoratedButton type="button" onClick={onClose} variant="secondary">
            Cancel
          </DecoratedButton>
          <DecoratedButton
            variant="primary"
            type="button"
            disabled={disabled || !!validationError || !hasChanges}
            onClick={onApplyChanges}
          >
            Apply Changes
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
