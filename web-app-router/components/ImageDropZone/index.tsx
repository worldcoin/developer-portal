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
        "w-full p-8 rounded-xl border-[1px] border-dashed border-blue-150  grid justify-items-center gap-y-4",
        {
          "hover:bg-blue-50 hover:border-solid hover:border-blue-500 cursor-pointer":
            !disabled,
        },
        {
          "bg-blue-50 border-solid border-blue-500": !disabled && isDragActive,
        },
        { "opacity-50 cursor-not-allowed": disabled },
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
