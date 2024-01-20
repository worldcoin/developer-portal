import React, { memo, useEffect, useState } from "react";

import { ImageUploadComponent } from "../ImageUpload/ImageUploadComponent";
import { ConfigurationFormValues } from "../Configuration";
import {
  FieldError,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { FieldLabel } from "@/components/FieldLabel";
import { useAppStore } from "@/stores/appStore";
import { useImage } from "@/hooks/useImage";

interface AppImageUploadSectionProps {
  register: UseFormRegister<ConfigurationFormValues>;
  setValue: UseFormSetValue<ConfigurationFormValues>;
  errors: FieldErrors<ConfigurationFormValues>;
  disabled: boolean;
}
type Urls = {
  logo_img_url: string;
  hero_image_url: string;
  showcase_img_urls: string[];
};

export const AppImageUploadSection = memo(function AppImageUploadSection(
  props: AppImageUploadSectionProps
) {
  const { register, setValue, errors, disabled } = props;
  const { currentApp } = useAppStore();
  const { unverifiedImages, getAllUnverifiedImages } = useImage({});
  useEffect(() => {
    getAllUnverifiedImages();
  }, [currentApp, getAllUnverifiedImages]);

  return (
    <div>
      <FieldLabel required className="my-3 font-rubik">
        Logo (500 x 500)
      </FieldLabel>
      <ImageUploadComponent
        register={register("logo_img_url")}
        setValue={setValue}
        imgSrc={unverifiedImages.logo_img_url}
        imageType="logo_img"
        width={500}
        height={500}
        disabled={disabled}
        errors={errors.logo_img_url}
      />
      <FieldLabel required className="my-3 font-rubik">
        Hero Image (1600 x 1200)
      </FieldLabel>
      <ImageUploadComponent
        register={register("hero_image_url")}
        imgSrc={unverifiedImages.hero_image_url}
        setValue={setValue}
        imageType="hero_image"
        width={1600}
        height={1200}
        disabled={disabled}
        errors={errors.hero_image_url}
      />
      <FieldLabel required className="my-3 font-rubik">
        Showcase Image (1920 x 1080)
      </FieldLabel>
      <div className="">
        <ImageUploadComponent
          index={0}
          register={register(`showcase_img_urls.${0}`)}
          imgSrc={unverifiedImages.showcase_img_urls?.[0]}
          setValue={setValue}
          imageType="showcase_img_1"
          width={1920}
          height={1080}
          disabled={disabled}
          errors={errors.showcase_img_urls?.[0] as FieldError | undefined}
        />
      </div>
    </div>
  );
});
