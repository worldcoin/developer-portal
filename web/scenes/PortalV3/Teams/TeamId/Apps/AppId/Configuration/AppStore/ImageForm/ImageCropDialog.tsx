"use client";

import { FormDialog } from "@/components/FormDialog";
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
    <FormDialog
      open={open}
      onClose={close}
      afterLeave={onClosed}
      dismissable={!isApplying}
      title={title}
      closeLabel="Close image cropper"
      panelClassName="md:w-[568px]"
    >
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
    </FormDialog>
  );
};
