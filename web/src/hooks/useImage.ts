// useImageUpload.ts
import { useState, useCallback, ChangeEvent, useEffect } from "react";
import { toast } from "react-toastify";
import { useAppStore } from "@/stores/appStore";

type ImageHookProps = {
  width?: number;
  height?: number;
  imageType: string;
  imgSrc?: string;
  fileType?: string;
};
export const useImage = (props: ImageHookProps) => {
  const { width, height, imageType, imgSrc, fileType } = props;
  const currentApp = useAppStore((store) => store.currentApp);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    imgSrc ?? null
  );

  useEffect(() => {
    setImagePreview(imgSrc ?? null);
  }, [imgSrc]);

  const getImage = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/images/get_images?app_id=${encodeURIComponent(
          currentApp?.id!
        )}&image_type=${encodeURIComponent(imageType)}`,
        {
          method: "GET",
        }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || "Failed to get image");
      }
      // Checks if the image was found in the s3 bucket otherwise it won't update the metadata
      setImagePreview(json.url);
    } catch (error) {
      toast.error("Could not find uploaded image.");

      console.error("Get image error:", error);
    }
  }, [currentApp?.id, imageType]);

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

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    // Handle file selection
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.type === fileType) {
      setSelectedFile(file);
      try {
        if (width && height) {
          await validateImageDimensions(file);
        }
        await uploadViaPresignedPost(file);
        // Shows the user the current image in the bucket after upload
        await getImage();
      } catch (error) {
        console.log(error);
      }
    } else {
      throw new Error("Invalid file type");
    }
  };

  const uploadViaPresignedPost = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        const response = await fetch("/api/images/upload_image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            app_id: currentApp?.id,
            image_type: imageType,
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.message || "Failed to get presigned POST data");
        }
        // Build a form for the request body
        const formData = new FormData();
        Object.keys(json.fields).forEach((key) =>
          formData.append(key, json.fields[key])
        );
        formData.append("Content-Type", file.type);
        formData.append("file", file);
        // Send the POST request to the presigned URL
        const uploadResponse = await fetch(json.url, {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const errorBody = await uploadResponse.text(); // or .json() if the response is in JSON format
          throw new Error(
            `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorBody}`
          );
        }
      } catch (error: any) {
        toast.error("Failed to upload image");
        console.error("Upload error:", error);
        setIsUploading(false);
        throw new Error(error);
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

  // ... Any other handlers or logic

  return {
    selectedFile,
    isUploading,
    imagePreview,
    setImagePreview,
    handleFileInput,
    removeImage,
  };
};
