import { Icon } from "@/components/Icon";
import useApps from "@/hooks/useApps";
import { IAppStore, useAppStore } from "@/stores/appStore";
import Image from "next/image";
import React, { useState, ChangeEvent, useCallback } from "react";
import { toast } from "react-toastify";

type ImageUploadComponentProps = {
  width?: number;
  height?: number;
  imageType: string;
};

const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({
  width,
  height,
  imageType,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const currentApp = useAppStore((store) => store.currentApp);
  const { updateAppMetadata } = useApps();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const validateImageDimensions = (
    file: File,
    expectedWidth: number,
    expectedHeight: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(url); // Clean up the URL object
        if (
          img.naturalWidth === expectedWidth &&
          img.naturalHeight === expectedHeight
        ) {
          resolve();
        } else {
          toast.error(
            `Image dimensions must be ${expectedWidth}x${expectedHeight}`
          );
          reject(`Image dimensions must be ${expectedWidth}x${expectedHeight}`);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject("Error loading image");
      };
      img.src = url;
    });
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    // Handle file selection
    const file = e.target.files ? e.target.files[0] : null;
    if (file && file.type === "image/png") {
      setSelectedFile(file);
      try {
        if (width && height) {
          await validateImageDimensions(file, width, height);
        }
        await uploadViaPresignedPost(file);
        toast.success("Image uploaded successfully");
        // Shows the user the current image in the bucket after upload
        await getImage();
        // Update the app metadata with the new image URL
      } catch (error) {
        console.log(error);
      }
    } else {
      toast.error("Please select a PNG image.");
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
        setIsUploading(false);
        console.log("File successfully uploaded");
      } catch (error) {
        toast.error("Failed to upload image");
        console.error("Upload error:", error);
        setIsUploading(false);
      }
    },
    [currentApp?.id, imageType]
  );
  const getImage = useCallback(async () => {
    try {
      const response = await fetch("/api/images/get_images", {
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
        throw new Error(json.message || "Failed to get image");
      }
      setImagePreview(json.url);
    } catch (error) {
      toast.error("Could not find uploaded image.");

      console.error("Get image error:", error);
    }
  }, [currentApp?.id, imageType]);

  return (
    <div className="">
      <label
        htmlFor="image-upload"
        className="flex border-2 border-dashed w-32 h-32 rounded-md cursor-pointer justify-center items-center"
      >
        {imagePreview ? (
          <>
            <Image
              src={imagePreview}
              alt="Uploaded"
              className="rounded-lg"
              width={width}
              height={height}
            />
            <button>
              <Icon
                className="w-6 h-6 relative top-0 right-0  text-neutral-primary"
                name="close"
              />
            </button>
          </>
        ) : (
          <div className="text-lg text-gray-300 text-center">
            <div className="text-4xl">+</div>
            Upload Logo
          </div>
        )}
      </label>
      <input
        id="image-upload"
        type="file"
        accept=".png"
        onChange={handleFileInput}
        style={{ display: "none" }}
      />
      {isUploading && <p>Uploading...</p>}
    </div>
  );
};

export default ImageUploadComponent;
