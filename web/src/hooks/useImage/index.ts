import { useState, useCallback, ChangeEvent, useEffect } from "react";
import { useAppStore } from "@/stores/appStore";
import { toast } from "react-toastify";
import gql from "graphql-tag";
import { graphQLRequest } from "@/lib/frontend-api";

type ImageHookProps = {
  width?: number;
  height?: number;
  imageType: string;
  imgSrc?: string;
  fileType?: string;
};
type PostFields = { [key: string]: any };

const UploadImageMutation = gql`
  query UploadImage(
    $app_id: String!
    $team_id: String!
    $image_type: String!
    $content_type_ending: String!
  ) {
    upload_image(
      app_id: $app_id
      team_id: $team_id
      image_type: $image_type
      content_type_ending: $content_type_ending
    ) {
      url
      fields {
        key
        value
      }
    }
  }
`;
export const useImage = (props: ImageHookProps) => {
  const { width, height, imageType, imgSrc, fileType } = props;
  const currentApp = useAppStore((store) => store.currentApp);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    imgSrc ?? null
  );
  // Track the current image preview for the upload object
  useEffect(() => {
    setImagePreview(imgSrc ?? null);
  }, [imgSrc]);
  // This function fetches the image by generating a signed URL to the unverified image item
  const getImage = useCallback(async () => {
    try {
      if (!currentApp?.id) {
        throw new Error("Current App ID is not defined");
      }
      const response = await fetch(
        `/api/images/get_images?app_id=${encodeURIComponent(
          currentApp?.id
        )}&image_type=${encodeURIComponent(imageType)}`,
        {
          method: "GET",
        }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || "Failed to get image");
      }
      setImagePreview(json.url);
    } catch (error) {
      console.error("Get image error:", error);
    }
  }, [currentApp?.id, imageType]);
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
    if (file && file.type === fileType) {
      setSelectedFile(file);
      try {
        if (width && height) {
          await validateImageDimensions(file);
        }
        await uploadViaPresignedPost(file);
        await getImage();
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
            fields: PostFields[];
          };
        }>({
          mutation: UploadImageMutation,
          variables: {
            app_id: currentApp.id,
            team_id: "test",
            image_type: imageType,
            content_type_ending: fileType,
          },
        });
        if (!response.data?.upload_image?.url) {
          throw new Error("Failed to get presigned URL");
        }
        const { url, fields } = response.data.upload_image;
        console.log("Presigned URL:", url);
        console.log("Fields:", fields);
        // const formData = new FormData();
        // Object.keys(fields).forEach((k) => formData.append(k, fields[k]));
        // formData.append("Content-Type", file.type);
        // formData.append("file", file);
        // const uploadResponse = await fetch(url, {
        //   method: "POST",
        //   body: formData,
        // });
        // if (!uploadResponse.ok) {
        //   const errorBody = await uploadResponse.json();
        //   throw new Error(
        //     `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorBody}`
        //   );
        // }
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
  };
};
