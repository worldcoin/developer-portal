import { useState } from "react";
import { toast } from "react-toastify";

export class ImageValidationError extends Error {
  public readonly toastId: string;
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
    this.toastId = "ImageValidationError";
  }
}

export type ImageDimensions = {
  width: number;
  height: number;
};

export const MAX_IMAGE_BYTES = 500 * 1024;

/** Decodes a local image once and returns its intrinsic pixel dimensions. */
export const readImageDimensions = (file: File): Promise<ImageDimensions> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();

    const cleanUp = () => URL.revokeObjectURL(url);

    image.onload = () => {
      cleanUp();
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      cleanUp();
      reject(new ImageValidationError("Unable to read this image"));
    };
    image.src = url;
  });

export const hasAspectRatio = (
  dimensions: ImageDimensions,
  width: number,
  height: number,
) => Math.abs(dimensions.width / dimensions.height - width / height) <= 0.01;

export const getImageUploadAction = async (
  file: File,
  width: number,
  height: number,
): Promise<"upload" | "crop"> => {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new ImageValidationError("Image must be a jpeg or png");
  }
  if (file.size >= MAX_IMAGE_BYTES) {
    throw new ImageValidationError("Image size must be under 500kB");
  }

  const dimensions = await readImageDimensions(file);
  return hasAspectRatio(dimensions, width, height) ? "upload" : "crop";
};

/**
 * Shared select → validate-once → crop-or-upload flow for image uploaders.
 * Validation happens only here, at selection time: cropper output is
 * exact-ratio and under the size limit by construction, so `upload` must not
 * re-validate the files it receives.
 */
export const useCroppedImageUpload = (params: {
  targetWidth: number;
  targetHeight: number;
  upload: (file: File) => Promise<unknown>;
}) => {
  const [cropCandidate, setCropCandidate] = useState<File>();

  const handleFileSelected = async (file: File) => {
    try {
      const action = await getImageUploadAction(
        file,
        params.targetWidth,
        params.targetHeight,
      );
      if (action === "crop") {
        setCropCandidate(file);
        return;
      }
      await params.upload(file);
    } catch (error) {
      if (!(error instanceof ImageValidationError)) {
        console.error("Image selection failed: ", error);
      }
      toast.error(
        error instanceof Error ? error.message : "Unable to read this image",
      );
    }
  };

  return {
    cropCandidate,
    clearCropCandidate: () => setCropCandidate(undefined),
    handleFileSelected,
  };
};

// The S3 transport (presigned POST + signed preview URL) lives in the shared
// upload transaction: scenes/common/.../Configuration/hook/use-app-image-upload.
