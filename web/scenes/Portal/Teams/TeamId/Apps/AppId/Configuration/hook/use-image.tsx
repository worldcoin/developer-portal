import { tryParseJSON } from "@/lib/utils";
import { toast } from "react-toastify";
import { useGetUploadedImageLazyQuery } from "./graphql/client/get-uploaded-image.generated";
import { useUploadImageLazyQuery } from "./graphql/client/upload-image.generated";

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export const useImage = () => {
  const [getUploadedImage] = useGetUploadedImageLazyQuery();

  const getImage = async (
    fileType: string, // png, jpeg
    appId: string,
    teamId: string,
    imageType: string, // logo, showcase, hero
  ) => {
    const response = await getUploadedImage({
      variables: {
        app_id: appId,
        image_type: imageType,
        content_type_ending: fileType,
        team_id: teamId,
      },
    });

    const imageUrl = response.data?.get_uploaded_image?.url;

    if (!imageUrl) {
      throw new Error("Failed to get presigned URL");
    }

    return imageUrl;
  };

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
            toastId: "ImageValidationError",
            type: "error",
          });
          reject(new ImageValidationError(`Image must be a jpeg or png`));
        }

        const imageAspectRatio = img.naturalWidth / img.naturalHeight;
        const targetAspectRatio = width / height;

        if (Math.abs(imageAspectRatio - targetAspectRatio) > 0.01) {
          toast(`Image must have an aspect ratio of ${width}:${height}`, {
            toastId: "ImageValidationError",
            type: "error",
          });
          reject(new ImageValidationError(`Image aspect ratio is incorrect`));
        }

        if (file.size >= 250 * 1024) {
          toast("Image size must be under 250KB", {
            toastId: "ImageValidationError",
            type: "error",
          });
          reject(new ImageValidationError(`Image size must be under 250KB`));
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
  const [uploadImage] = useUploadImageLazyQuery({});

  const uploadViaPresignedPost = async (
    file: File,
    appId: string,
    teamId: string,
    imageType: string,
  ) => {
    const response = await uploadImage({
      variables: {
        app_id: appId,
        image_type: imageType,
        content_type_ending: file.type.split("/")[1],
        team_id: teamId,
      },
    });

    if (!response.data?.upload_image?.url) {
      throw new Error("Failed to get upload signed URL");
    }

    const { url, stringifiedFields } = response.data.upload_image;

    const fields = tryParseJSON(stringifiedFields);

    if (!fields) {
      throw new Error("Failed to parse fields");
    }

    const formData = new FormData();

    Object.entries(fields).forEach(([key, value]) =>
      formData.append(key, value as string),
    );

    formData.append("Content-Type", file.type);
    formData.append("file", file);

    const uploadResponse = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.json();
      throw new Error(
        `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorBody}`,
      );
    }
  };

  return {
    getImage,
    validateImageAspectRatio,
    uploadViaPresignedPost,
  };
};
