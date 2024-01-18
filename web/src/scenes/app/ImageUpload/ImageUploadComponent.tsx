import { Icon } from "@/components/Icon";
import Image from "next/image";
import React, { ChangeEvent, useCallback, memo } from "react";
import {
  UseFormRegisterReturn,
  FieldError,
  UseFormSetValue,
} from "react-hook-form";
import { ConfigurationFormValues } from "../Configuration";
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
  key?: number;
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
    key,
    ...otherProps
  } = props;
  const { isUploading, imagePreview, removeImage, handleFileInput } = useImage({
    width,
    height,
    imageType,
    imgSrc,
    fileType: "image/png",
  });
  const formItemName = register.name as keyof ConfigurationFormValues;
  const dbImageValue = key ? `${imageType}_${key}.png` : `${imageType}.png`;

  const registerRemoveImage = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      try {
        setValue(formItemName, "");
        removeImage(event);
      } catch (error) {
        console.error(error);
      }
    },
    [setValue, formItemName, removeImage]
  );

  const registerImageUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      try {
        handleFileInput(event);
        setValue(formItemName, dbImageValue);
      } catch (error) {
        console.error(error);
      }
    },
    [handleFileInput, setValue, formItemName, dbImageValue]
  );

  return (
    <div className={`${disabled ?? "opacity-30"}`}>
      <label className="flex border-2 border-dashed w-32 h-32 rounded-md cursor-pointer justify-center items-center">
        {imagePreview ? (
          <div className="relative">
            <button
              className="absolute top-0 right-0 cursor-pointer"
              onClick={registerRemoveImage}
            >
              <Icon name="close" className="w-6 h-6 bg-danger" />
            </button>
            <Image
              src={imgSrc ?? imagePreview}
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
          accept=".png"
          disabled={disabled}
          {...otherProps}
          onChange={registerImageUpload}
          style={{ display: "none" }}
        />
      </label>

      {isUploading && <p>Uploading...</p>}
    </div>
  );
});
