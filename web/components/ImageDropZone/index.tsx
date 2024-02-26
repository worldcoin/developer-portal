"use client";
import clsx from "clsx";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

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
};

export const ImageDropZone = (props: ImageDropZoneProps) => {
  const {
    disabled,
    width,
    height,
    uploadImage,
    imageType,
    children,
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
        "grid w-full justify-items-center gap-y-4 rounded-xl border-[1px]  border-dashed border-blue-150 p-8",
        {
          "cursor-pointer hover:border-solid hover:border-blue-500 hover:bg-blue-50":
            !disabled,
        },
        {
          "border-solid border-blue-500 bg-blue-50": !disabled && isDragActive,
        },
        { "cursor-not-allowed opacity-50": disabled },
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
    </label>
  );
};
