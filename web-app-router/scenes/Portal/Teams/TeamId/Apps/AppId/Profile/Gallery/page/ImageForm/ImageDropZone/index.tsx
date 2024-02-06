"use client";
import { UploadIcon } from "@/components/Icons/UploadIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";

type ImageDropZoneProps = {
  registerImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
};

export const ImageDropZone = (props: ImageDropZoneProps) => {
  const {
    registerImageUpload,
    disabled,
    width,
    height,
    uploadImage,
    imageType,
    ...otherProps
  } = props;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (uploadImage && imageType) {
        uploadImage(imageType, acceptedFiles[0], height, width);
      }
    },
    [uploadImage, imageType],
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
        // onChange={handleFileUpload}
        {...getInputProps()}
        {...otherProps}
        style={{ display: "none" }}
      />
      <UploadIcon className="h-12 w-12 text-blue-500" />
      <div className="gap-y-2">
        <div className="text-center">
          <Typography variant={TYPOGRAPHY.M3} className="text-blue-500">
            Click to upload
          </Typography>{" "}
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
            {" "}
            or drag and drop
          </Typography>
        </div>
        <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
          {`JPG or PNG (max 250kb), required size ${width}x${height}px`}
        </Typography>
      </div>
    </label>
  );
};
