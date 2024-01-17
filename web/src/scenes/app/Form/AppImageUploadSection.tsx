import React, { memo } from "react";

import { ImageUploadComponent } from "../ImageUpload/ImageUploadComponent";
import { ConfigurationFormValues } from "../Configuration";
import { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { FieldLabel } from "@/components/FieldLabel";

interface AppImageUploadSectionProps {
  register: UseFormRegister<ConfigurationFormValues>;
  setValue: UseFormSetValue<ConfigurationFormValues>;
  errors: FieldErrors<ConfigurationFormValues>;
  disabled: boolean;
}
export const AppImageUploadSection = memo(function AppImageUploadSection(
  props: AppImageUploadSectionProps
) {
  const { register, setValue, errors, disabled } = props;

  return (
    <div>
      <FieldLabel required className="mb-2 font-rubik">
        Logo
      </FieldLabel>
      <ImageUploadComponent
        register={register("logo_img_url")}
        setValue={setValue}
        imageType="logo_img"
        width={500}
        height={500}
        disabled={disabled}
        errors={errors.logo_img_url}
      />
    </div>
  );
});
