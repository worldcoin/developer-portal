"use client";

import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useEffect, useState } from "react";
import { ImageCropper } from "./ImageCropper";

type ImageCropDialogProps = {
  file?: File;
  title: string;
  targetWidth: number;
  targetHeight: number;
  isApplying: boolean;
  onApply: (file: File) => Promise<boolean>;
  onClosed: () => void;
  previewAlt?: string;
};

export const ImageCropDialog = ({
  file,
  title,
  targetWidth,
  targetHeight,
  isApplying,
  onApply,
  onClosed,
  previewAlt,
}: ImageCropDialogProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (file) setOpen(true);
  }, [file]);

  const close = () => setOpen(false);

  return (
    <Dialog open={open} onClose={close} afterLeave={onClosed}>
      <DialogOverlay />
      <DialogPanel className="grid gap-y-10 md:max-w-xl">
        <div className="grid w-full grid-cols-1fr/auto justify-between">
          <Typography variant={TYPOGRAPHY.H6}>{title}</Typography>
          <Button
            type="button"
            aria-label="Close image cropper"
            onClick={close}
            className="flex size-7 items-center justify-center rounded-full bg-grey-100 hover:bg-grey-200"
          >
            <CloseIcon className="size-4" />
          </Button>
        </div>
        {file ? (
          <ImageCropper
            file={file}
            targetWidth={targetWidth}
            targetHeight={targetHeight}
            isApplying={isApplying}
            onCancel={close}
            onApply={async (croppedFile) => {
              if (await onApply(croppedFile)) close();
            }}
            previewAlt={previewAlt}
          />
        ) : null}
      </DialogPanel>
    </Dialog>
  );
};
