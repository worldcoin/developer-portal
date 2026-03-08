"use client";
import clsx from "clsx";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { TYPOGRAPHY, Typography } from "../Typography";

type ImageDropZoneProps = {
  disabled?: boolean;
  width: number;
  height: number;
  uploadImage?: (
    itemType: string,
    file: File,
    height: number,
    width: number,
  ) => void;
  imageType?: string;
  children?: React.ReactNode;
  error?: string | null;
  className?: string;
};

export const ImageDropZone = (props: ImageDropZoneProps) => {
  const {
    disabled,
    width,
    height,
    uploadImage,
    imageType,
    children,
    error,
    className,
    ...otherProps
  } = props;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (uploadImage && imageType) {
        uploadImage(imageType, acceptedFiles[0], height, width);
      }
    },
    [uploadImage, imageType, height, width],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  return (
    <label
      className={clsx(
        "flex w-full flex-col items-center justify-center gap-y-3 rounded-[10px] border border-dashed p-6",
        {
          "cursor-pointer border-grey-200 bg-grey-50 hover:bg-grey-100":
            !disabled && !error && !isDragActive,
          "border-blue-500 bg-blue-50": !disabled && isDragActive,
          "border-system-error-500 bg-system-error-50": error && !disabled,
          "cursor-not-allowed opacity-50": disabled,
        },
        className,
      )}
      {...getRootProps()}
    >
      <input
        type="file"
        accept=".png,.jpg,.jpeg"
        disabled={disabled}
        {...getInputProps()}
        {...otherProps}
        style={{ display: "none" }}
        className="hidden"
      />
      {children}
      {error && (
        <Typography variant={TYPOGRAPHY.R5} className="text-red-500">
          {error}
        </Typography>
      )}
    </label>
  );
};
