import { Icon } from "@/components/Icon";
import Image from "next/image";
import React, { ChangeEvent, useCallback, memo } from "react";
import {
  UseFormRegisterReturn,
  FieldError,
  UseFormSetValue,
} from "react-hook-form";
import { ConfigurationFormValues } from "../Configuration";
import { toast } from "react-toastify";
import { useImage } from "@/hooks/useImage";

type ImageUploadComponentProps = {
  register: UseFormRegisterReturn;
  errors?: FieldError;
  setValue: UseFormSetValue<ConfigurationFormValues>;
  width?: number;
  height?: number;
  imageType: string;
  imgSrc?: string;
  disabled: boolean;
  index?: number;
};
export const ImageUploadComponent = memo(function ImageUploadComponent(
  props: ImageUploadComponentProps
) {
  const {
    register,
    setValue,
    errors,
    disabled,
    imageType,
    imgSrc,
    width,
    height,
    index,
    ...otherProps
  } = props;

  const formItemName = register.name as keyof ConfigurationFormValues;
  const { isUploading, imagePreview, removeImage, handleFileInput } = useImage({
    width,
    height,
    imageType,
    imgSrc,
    setValue,
    formItemName,
  });
  const registerRemoveImage = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      try {
        setValue(formItemName, "");
        removeImage(event);
      } catch (error) {
        toast.error("Unable to remove image");
        console.error(error);
      }
    },
    [formItemName, removeImage, setValue]
  );

  const registerImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      try {
        await handleFileInput(event);
      } catch (error) {
        toast.error("Image upload failed");
        console.error(error);
      }
    },
    [handleFileInput]
  );
  return (
    <div>
      <label className="flex border-2 border-dashed w-32 h-32 rounded-md cursor-pointer justify-center items-center">
        {imagePreview ? (
          <div className="relative">
            <button
              className="absolute top-0 right-0 cursor-pointer disabled:hidden"
              onClick={registerRemoveImage}
              disabled={disabled}
            >
              <Icon name="close" className="w-6 h-6 bg-danger" />
            </button>
            <Image
              src={imagePreview ?? imgSrc}
              alt="Uploaded"
              className="rounded-lg w-32 h-32 object-contain"
              width={width}
              height={height}
            />
          </div>
        ) : (
          <div className="text-4xl text-gray-300 text-center">+</div>
        )}
        <input
          type="file"
          accept=".png,.jpg,.jpeg"
          disabled={disabled}
          {...otherProps}
          onChange={registerImageUpload}
          style={{ display: "none" }}
        />
      </label>

      {isUploading && <p>Uploading...</p>}
      {errors?.message && (
        <span className="pt-2 left-0 flex items-center text-12 text-danger">
          {String(errors?.message)}
        </span>
      )}
    </div>
  );
});
