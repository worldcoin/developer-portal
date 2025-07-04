import { UploadIcon } from "@/components/Icons/UploadIcon";
import { JSONFileDropZone } from "@/components/JSONFileDropZone";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { MAX_FILE_SIZE } from "./constants";

type JSONFileUploadProps = {
  onFileUpload: (file: File) => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
};

export const JSONFileUpload = ({
  onFileUpload,
  disabled,
  isLoading,
}: JSONFileUploadProps) => {
  if (isLoading) return null;

  return (
    <JSONFileDropZone
      disabled={disabled || isLoading}
      uploadFile={onFileUpload}
      error={null}
    >
      <UploadIcon className="size-12 text-blue-500" />
      <div className="gap-y-2">
        <div className="text-center">
          <Typography variant={TYPOGRAPHY.M3} className="text-blue-500">
            Click to upload
          </Typography>{" "}
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-700">
            or drag and drop
          </Typography>
        </div>
        <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
          .json file (max {MAX_FILE_SIZE / 1024}kb).
        </Typography>
      </div>
    </JSONFileDropZone>
  );
};
