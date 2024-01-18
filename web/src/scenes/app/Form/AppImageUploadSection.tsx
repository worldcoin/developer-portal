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
  const currentApp = useAppStore((store) => store.currentApp);
  const [signedUrls, setSignedUrls] = useState<Urls>({
    logo_img_url: "",
    hero_image_url: "",
    showcase_img_urls: [],
  });

  useEffect(() => {
    const fetchSignedUrls = async () => {
      try {
        const response = await fetch("/api/images/get_unverified", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            app_id: currentApp?.id,
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.message || "Failed to get image");
        }
        const urls: Urls = json.urls;
        console.log(urls);
        setSignedUrls(urls);
      } catch (error) {
        console.error("Get image error:", error);
      }
    };
    fetchSignedUrls();
  }, [currentApp]);
  return (
    <div>
      <FieldLabel required className="my-3 font-rubik">
        Logo (500 x 500 required)
      </FieldLabel>
      <ImageUploadComponent
        register={register("logo_img_url")}
        setValue={setValue}
        imgSrc={signedUrls.logo_img_url}
        imageType="logo_img"
        width={500}
        height={500}
        disabled={disabled}
        errors={errors.logo_img_url}
      />
      <FieldLabel required className="my-3 font-rubik">
        Hero Image (1600 x 1200 required)
      </FieldLabel>
      <ImageUploadComponent
        register={register("hero_image_url")}
        imgSrc={signedUrls.hero_image_url}
        setValue={setValue}
        imageType="hero_image"
        width={1600}
        height={1200}
        disabled={disabled}
        errors={errors.hero_image_url}
      />
      <FieldLabel required className="my-3 font-rubik">
        Showcase Images (1920 x 1080 required)
      </FieldLabel>
      <div className="flex flex-row gap-3">
        <ImageUploadComponent
          key={1}
          register={register("showcase_img_urls")}
          imgSrc={signedUrls.showcase_img_urls[0]}
          setValue={setValue}
          imageType="showcase_img"
          width={1920}
          height={1080}
          disabled={disabled}
          errors={errors.showcase_img_urls?.[0] as FieldError | undefined}
        />
        <ImageUploadComponent
          key={2}
          register={register("showcase_img_urls")}
          imgSrc={signedUrls.showcase_img_urls[1]}
          setValue={setValue}
          imageType="showcase_img"
          width={1920}
          height={1080}
          disabled={disabled}
          errors={errors.showcase_img_urls?.[1] as FieldError | undefined}
        />
        <ImageUploadComponent
          key={3}
          register={register("showcase_img_urls")}
          imgSrc={signedUrls.showcase_img_urls[2]}
          setValue={setValue}
          imageType="showcase_img"
          width={1920}
          height={1080}
          disabled={disabled}
          errors={errors.showcase_img_urls?.[2] as FieldError | undefined}
        />
      </div>
    </div>
  );
});
