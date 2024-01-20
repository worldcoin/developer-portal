import { useState, useCallback, ChangeEvent, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { toast } from "react-toastify";
import gql from "graphql-tag";
import { graphQLRequest } from "@/lib/frontend-api";
import { UseFormSetValue } from "react-hook-form";
import { ConfigurationFormValues } from "@/scenes/app/Configuration";

type ImageHookProps = {
  width?: number;
  height?: number;
  imageType?: string;
  imgSrc?: string;
  fileType?: string;
  setValue?: UseFormSetValue<ConfigurationFormValues>;
  formItemName?: keyof ConfigurationFormValues;
};

type UnverifiedImages = {
  logo_img_url: string | undefined;
  hero_image_url: string | undefined;
  showcase_img_urls: string[] | undefined;
};

const UploadImageQuery = gql`
  query UploadImageQuery(
    $app_id: String!
    $image_type: String!
    $content_type_ending: String!
  ) {
    upload_image(
      app_id: $app_id
      image_type: $image_type
      content_type_ending: $content_type_ending
    ) {
      url
      stringifiedFields
    }
  }
`;

const getUploadedImageQuery = gql`
  query GetUploadedImageQuery(
    $app_id: String!
    $image_type: String!
    $content_type_ending: String!
  ) {
    get_uploaded_image(
      app_id: $app_id
      image_type: $image_type
      content_type_ending: $content_type_ending
    ) {
      url
    }
  }
`;

const getAllUnverifiedImagesQuery = gql`
  query GetAllUnverifiedImagesQuery($app_id: String!) {
    get_all_unverified_images(app_id: $app_id) {
      logo_img_url
      hero_image_url
      showcase_img_urls
    }
  }
`;

export const useImage = (props: ImageHookProps) => {
  const { width, height, imageType, imgSrc, formItemName, setValue } = props;
  const currentApp = useAppStore((store) => store.currentApp);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    imgSrc ?? null
  );
  const [unverifiedImages, setUnverifiedImages] = useState<UnverifiedImages>({
    logo_img_url: undefined,
    hero_image_url: undefined,
    showcase_img_urls: undefined,
  });
  // Track the current image preview for the upload object
  useEffect(() => {
    setImagePreview(imgSrc ?? null);
  }, [imgSrc]);

  const getAllUnverifiedImages = useCallback(async () => {
    try {
      if (!currentApp?.id) {
        throw new Error("Current App ID is not defined");
      }
      const response = await graphQLRequest<{
        get_all_unverified_images: UnverifiedImages;
      }>({
        query: getAllUnverifiedImagesQuery,
        variables: {
          app_id: currentApp.id,
        },
      });
      const images = response.data?.get_all_unverified_images;
      if (!images) {
        throw new Error("Failed to get unverified images");
      }
      setUnverifiedImages(images);
    } catch (error) {
      console.error("Get image error:", error);
    }
  }, [currentApp?.id]);
  // This function fetches the image by generating a signed URL to the unverified image item
  const getImage = useCallback(
    async (fileType: string) => {
      try {
        if (!currentApp?.id) {
          throw new Error("Current App ID is not defined");
        }

        const response = await graphQLRequest<{
          get_uploaded_image: {
            url: string;
          };
        }>({
          query: getUploadedImageQuery,
          variables: {
            app_id: currentApp.id,
            image_type: imageType,
            content_type_ending: fileType,
          },
        });

        const imageUrl = response.data?.get_uploaded_image.url;
        if (!imageUrl) {
          throw new Error("Failed to get presigned URL");
        }
        setImagePreview(imageUrl);
        if (setValue && formItemName) {
          setValue(formItemName!, `${imageType}.${fileType}`);
        } else {
          throw new Error("setValue or formItemName is not defined");
        }
      } catch (error) {
        console.error("Get image error:", error);
      }
    },
    [currentApp?.id, formItemName, imageType, setValue]
  );
  // This function is used to enforce strict dimensions for the uploaded images
  const validateImageDimensions = useCallback(
    (file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
          URL.revokeObjectURL(url); // Clean up the URL object
          if (img.naturalWidth === width && img.naturalHeight === height) {
            resolve();
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
    },
    [width, height]
  );
  // This function is called when the user selects a file to upload, and calls get image to visually confirm the image was uploaded.
  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const fileTypeEnding = file.type.split("/")[1];
      setSelectedFile(file);
      try {
        if (width && height) {
          await validateImageDimensions(file);
        }
        await uploadViaPresignedPost(file);
        await getImage(fileTypeEnding);
      } catch (error) {
        console.error(error);
        throw new Error("Image Upload Failed");
      }
    }
  };
  // This function generates a presigned url for image upload. We restrict based on content type
  const uploadViaPresignedPost = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        if (!currentApp?.id) {
          throw new Error("Current App ID is not defined");
        }
        const response = await graphQLRequest<{
          upload_image: {
            url: string;
            stringifiedFields: any;
          };
        }>({
          query: UploadImageQuery,
          variables: {
            app_id: currentApp.id,
            image_type: imageType,
            content_type_ending: file.type.split("/")[1],
          },
        });
        if (!response.data?.upload_image?.url) {
          throw new Error("Failed to get presigned URL");
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
      } catch (error) {
        console.error("Upload error:", error);
        setIsUploading(false);
        throw new Error("Failed to upload image");
      }
      setIsUploading(false);
    },
    [currentApp?.id, imageType]
  );

  const removeImage = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setImagePreview(null);
    },
    [setImagePreview]
  );

  return {
    selectedFile,
    isUploading,
    imagePreview,
    setImagePreview,
    handleFileInput,
    removeImage,
    unverifiedImages,
    getAllUnverifiedImages,
  };
};
