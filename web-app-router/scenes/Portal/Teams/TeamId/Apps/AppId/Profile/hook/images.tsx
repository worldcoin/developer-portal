import {
  useGetUploadedImageLazyQuery,
  useGetUploadedImageQuery,
} from "./graphql/client/get-uploaded-image.generated";
import {
  useUploadImageLazyQuery,
  useUploadImageQuery,
} from "./graphql/client/upload-image.generated";
import { toast } from "react-toastify";

export const useImage = () => {
  const [getUploadedImage] = useGetUploadedImageLazyQuery();
  const getImage = async (
    fileType: string, // png, jpeg
    appId: string,
    teamId: string,
    imageType: string // logo, showcase, hero
  ) => {
    const response = await getUploadedImage({
      variables: {
        app_id: appId,
        image_type: imageType,
        content_type_ending: fileType,
      },
      context: { headers: { teamId } },
    });
    const imageUrl = response.data?.get_uploaded_image?.url;
    if (!imageUrl) {
      throw new Error("Failed to get presigned URL");
    }
    return imageUrl;
  };

  const validateImageDimensions = (
    file: File,
    width: number,
    height: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(url); // Clean up the URL object
        if (img.naturalWidth === width && img.naturalHeight === height) {
          if (file.size <= 250 * 1024) {
            resolve();
          } else {
            toast.error(`Image size must be under 250KB`);
            reject(`Image size must be under 250KB`);
          }
        } else {
          toast.error(`Image dimensions must be ${width}x${height}`);
          reject(`Image dimensions must be ${width}x${height}`);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject("Error loading image");
      };
      img.src = url;
    });
  };
  const [uploadImage] = useUploadImageLazyQuery({});

  const uploadViaPresignedPost = async (
    file: File,
    appId: string,
    teamId: string,
    imageType: string
  ) => {
    const response = await uploadImage({
      variables: {
        app_id: appId,
        image_type: imageType,
        content_type_ending: file.type.split("/")[1],
      },
      context: { headers: { teamId } },
    });
    console.log(response);

    if (!response.data?.upload_image?.url) {
      throw new Error("Failed to get upload signed URL");
    }

    const { url, stringifiedFields } = response.data.upload_image;
    const fields = JSON.parse(stringifiedFields);
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) =>
      formData.append(key, value as string)
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
        `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorBody}`
      );
    }
  };

  return {
    getImage,
    validateImageDimensions,
    uploadViaPresignedPost,
  };
};
