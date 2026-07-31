import { toast } from "react-toastify";

export class ImageValidationError extends Error {
  public readonly toastId: string;
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
    this.toastId = "ImageValidationError";
  }
}

// The S3 transport (presigned POST + signed preview URL) lives in the shared
// upload transaction: scenes/common/.../Configuration/hook/use-app-image-upload.
export const useImage = () => {
  const validateImageAspectRatio = (
    file: File,
    width: number,
    height: number,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(url); // Clean up the URL object

        if (!["image/jpeg", "image/png"].includes(file.type)) {
          toast("Image must be a jpeg or png", {
            toastId: ImageValidationError.prototype.toastId,
            type: "error",
          });
          reject(new ImageValidationError(`Image must be a jpeg or png`));
        }

        const imageAspectRatio = img.naturalWidth / img.naturalHeight;
        const targetAspectRatio = width / height;

        if (Math.abs(imageAspectRatio - targetAspectRatio) > 0.01) {
          toast(`Image must have an aspect ratio of ${width}:${height}`, {
            toastId: ImageValidationError.prototype.toastId,
            type: "error",
          });
          reject(new ImageValidationError(`Image aspect ratio is incorrect`));
        }

        if (file.size >= 500 * 1024) {
          toast("Image size must be under 500kB", {
            toastId: ImageValidationError.prototype.toastId,
            type: "error",
          });
          reject(new ImageValidationError(`Image size must be under 500kB`));
        }
        resolve();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject("Error loading image");
      };

      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "blob:") {
        reject("Invalid image URL");
      }

      img.src = parsedUrl.href;
    });
  };

  return {
    validateImageAspectRatio,
  };
};
