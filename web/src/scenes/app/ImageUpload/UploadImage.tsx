import React, { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { IAppStore, useAppStore } from "@/stores/appStore";
import ImageUploadComponent from "./ImageUploadComponent";

const getStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const ImageUpload = () => {
  const { currentApp } = useAppStore(getStore);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const uploadViaPresignedPost = useCallback(
    async (file: File) => {
      try {
        // Get presigned POST URL and form fields
        const response = await fetch("/api/upload_image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            app_id: currentApp?.id,
            image_type: "logo_img",
          }),
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.message || "Failed to get presigned POST data");
        }
        console.log(json);
        // Build a form for the request body
        const formData = new FormData();
        Object.keys(json.fields).forEach((key) =>
          formData.append(key, json.fields[key])
        );
        formData.append("file", file);

        // Send the POST request to the presigned URL
        const uploadResponse = await fetch(json.url, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        console.log("File successfully uploaded");
      } catch (error) {
        console.error("Upload error:", error);
      }
    },
    [currentApp?.id]
  );

  const handleUpload = useCallback(() => {
    if (selectedFile) {
      uploadViaPresignedPost(selectedFile);
    }
  }, [selectedFile, uploadViaPresignedPost]);

  return (
    <div>
      <ImageUploadComponent onFileSelect={handleFileSelect} />
      <Button
        variant="primary"
        className="px-3 mr-5 w-28 h-7"
        onClick={handleUpload}
      >
        Save
      </Button>
    </div>
  );
};
