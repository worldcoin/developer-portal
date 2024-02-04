"use client";
import { UploadIcon } from "@/components/Icons/UploadIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";

type ImageDropZoneProps = {
  registerImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  width: number;
  height: number;
};

export const ImageDropZone = (props: ImageDropZoneProps) => {
  const { registerImageUpload, disabled, width, height, ...otherProps } = props;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles);
    toast.success("Image saved");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <label
      className="w-full p-8 rounded-xl border-[1px] border-dashed border-blue-150 cursor-pointer grid justify-items-center gap-y-4"
      {...getRootProps()}
    >
      <input
        type="file"
        accept=".png,.jpg,.jpeg"
        disabled={disabled}
        {...getInputProps()}
        {...otherProps}
        onChange={registerImageUpload}
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
