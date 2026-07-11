import { tryParseJSON } from "@/lib/utils";
import posthog from "posthog-js";
import { toast } from "react-toastify";
import { useGetUploadedImageLazyQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/graphql/client/get-uploaded-image.generated";
import { useUploadImageLazyQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/graphql/client/upload-image.generated";

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

export const useImage = () => {
  const [getUploadedImage, { refetch }] = useGetUploadedImageLazyQuery();

  const getImage = async (
    fileType: string, // png, jpeg
    appId: string,
    teamId: string,
    imageType: string, // logo, showcase, hero
    locale?: string, // optional locale parameter
  ) => {
    const response = await getUploadedImage({
      variables: {
        app_id: appId,
        image_type: imageType,
        content_type_ending: fileType,
        team_id: teamId,
        locale: locale,
      },
    });

    const imageUrl = response.data?.get_uploaded_image?.url;

    if (!imageUrl) {
      throw new Error("Failed to get presigned URL");
    }

    return imageUrl;
  };

  const validateImageAspectRatio = async (
    file: File,
    width: number,
    height: number,
  ): Promise<void> => {
    const fail = (message: string): never => {
      toast(message, {
        toastId: ImageValidationError.prototype.toastId,
        type: "error",
      });
      throw new ImageValidationError(message);
    };

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      fail("Image must be a jpeg or png");
    }

    const dimensions = await readImageDimensions(file).catch(() =>
      fail("Unable to read this image"),
    );
    if (!hasAspectRatio(dimensions, width, height)) {
      fail(`Image must have an aspect ratio of ${width}:${height}`);
    }

    if (file.size >= MAX_IMAGE_BYTES) {
      fail("Image size must be under 500kB");
    }
  };
  const [uploadImage] = useUploadImageLazyQuery({
    fetchPolicy: "network-only",
  });

  const uploadViaPresignedPost = async (
    file: File,
    appId: string,
    teamId: string,
    imageType: string,
    locale?: string,
    signal?: AbortSignal,
  ) => {
    const response = await uploadImage({
      variables: {
        app_id: appId,
        image_type: imageType,
        content_type_ending: file.type.split("/")[1],
        team_id: teamId,
        locale: locale,
      },
    });

    if (!response.data?.upload_image?.url) {
      // Surface the server's error (e.g. missing AWS credentials on a local
      // stack) instead of a blind "failed" — it lands in the console/toast.
      throw new Error(
        response.error?.message
          ? `Failed to get upload signed URL: ${response.error.message}`
          : "Failed to get upload signed URL",
      );
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
      signal,
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      // The presigned POST goes browser → S3 without touching our servers, so
      // this failure is invisible to server logs — emit it from the client.
      posthog.capture("image_upload_failed", {
        app_id: appId,
        team_id: teamId,
        image_type: imageType,
        status: uploadResponse.status,
      });
      throw new Error(
        `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorBody}`,
      );
    }

    await refetch({
      app_id: appId,
      image_type: imageType,
      content_type_ending: file.type.split("/")[1],
      team_id: teamId,
      locale: locale,
    });
  };

  return {
    getImage,
    validateImageAspectRatio,
    uploadViaPresignedPost,
  };
};
