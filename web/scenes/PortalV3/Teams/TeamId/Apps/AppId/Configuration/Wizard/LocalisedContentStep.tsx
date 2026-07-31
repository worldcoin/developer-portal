"use client";

import { languageMap } from "@/lib/languages";
import { useUnverifiedImages } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/hooks/use-localised-image-field";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { useAppStoreFormContext } from "../AppStore/app-store";
import { MetaTagImageField } from "../AppStore/ImageForm/MetaTagImageField";
import { ShowcaseImagesField } from "../AppStore/ImageForm/ShowcaseImagesField";
import { SectionHeader } from "./SectionHeader";
import { TextAreaField } from "./TextAreaField";
import { TextField } from "./TextField";

const localeLabel = (locale: string) =>
  languageMap[locale as keyof typeof languageMap]?.label ?? locale;

const localeFlagCode = (locale: string) =>
  languageMap[locale as keyof typeof languageMap]?.country_code;

/** The wizard-styled inner copy for the shared image drop zones. */
const dropZoneContent = (
  <>
    <Icon name="share-ios" className="size-6" />
    {/* Copy color is Figma Primary/Grey/500 (#717680) — the repo's grey-500
        is #657080, so no token matches. */}
    <span className="flex flex-col items-center justify-center gap-1 text-center text-13 leading-[1.3] font-[350] whitespace-nowrap">
      <span className="text-[#717680]">Drop image here to upload</span>
      <span className="text-[#717680]">
        or <span className="text-portal-text">browse files</span>
      </span>
    </span>
  </>
);

/**
 * Step 3 of the configuration wizard: per-language listing content, bound to
 * the shared App Store form's localisations field array. Text autosaves with
 * the form; images upload through the shared presigned-POST pipeline and
 * upsert their localisation row immediately, exactly as on the previous page.
 */
export const LocalisedContentStep = (props: { isMiniApp: boolean }) => {
  const {
    control,
    errors,
    localisations,
    isEditable,
    isEnoughPermissions,
    appMetadata,
    appId,
    teamId,
    supportedLanguages,
    installCommittedValue,
  } = useAppStoreFormContext();
  const disabled = !isEditable || !isEnoughPermissions;
  const isAppVerified = appMetadata.verification_status === "verified";

  const [activeLocale, setActiveLocale] = useState(
    localisations[0]?.language ?? "en",
  );
  // The active language can disappear when it's removed on the Availability
  // step; fall back to the first remaining row (en is always present).
  const selectedIndex = Math.max(
    0,
    localisations.findIndex((field) => field.language === activeLocale),
  );
  const fieldErrors = errors.localisations?.[selectedIndex];
  const selectedLocale = localisations[selectedIndex]?.language ?? "en";

  // One images subscription for both image fields of the selected locale.
  const { unverifiedImages, isImagesLoading } = useUnverifiedImages({
    appId,
    teamId,
    locale: selectedLocale,
  });

  return (
    <div className="flex w-full flex-col gap-14">
      <section className="flex w-full flex-col gap-5">
        <SectionHeader
          title="Localisations"
          required
          description="Provide localized content for each supported language."
        />

        <div className="flex flex-wrap items-start gap-2">
          {localisations.map((field, index) => {
            const locale = field.language;
            const isActive = index === selectedIndex;
            const hasErrors = Boolean(errors.localisations?.[index]);
            const flagCode = localeFlagCode(locale);
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={clsx(
                  "flex h-8 items-center justify-center gap-1 rounded-2xl py-1.5 pr-3.5 pl-1.5",
                  isActive
                    ? "bg-portal-canvas"
                    : "border border-portal-border bg-white",
                  hasErrors && "border border-[#ea392a]",
                )}
              >
                {flagCode && (
                  <img
                    src={`/icons/flags/${flagCode}.svg`}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0"
                  />
                )}
                <span
                  className={clsx(
                    "text-13 leading-[1.2] font-semibold whitespace-nowrap",
                    hasErrors ? "text-[#ea392a]" : "text-portal-ink",
                  )}
                >
                  {localeLabel(locale)}
                </span>
              </button>
            );
          })}
        </div>

        <Controller
          control={control}
          name={`localisations.${selectedIndex}.name`}
          render={({ field }) => (
            <TextField
              label="App name"
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              error={fieldErrors?.name?.message}
            />
          )}
        />

        {props.isMiniApp && (
          <div className="flex w-full items-start gap-4">
            <Controller
              control={control}
              name={`localisations.${selectedIndex}.short_name`}
              render={({ field }) => (
                <TextField
                  label="Short name"
                  maxLength={11}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  error={fieldErrors?.short_name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name={`localisations.${selectedIndex}.world_app_description`}
              render={({ field }) => (
                <TextField
                  label="App tag line"
                  maxLength={40}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={disabled}
                  error={fieldErrors?.world_app_description?.message}
                />
              )}
            />
          </div>
        )}

        <Controller
          control={control}
          name={`localisations.${selectedIndex}.description_overview`}
          render={({ field }) => (
            <TextAreaField
              label="Description"
              maxLength={1500}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              error={fieldErrors?.description_overview?.message}
            />
          )}
        />
      </section>

      <section className="flex w-full flex-col gap-5">
        <SectionHeader
          title="Showcase images"
          required
          description="Upload up to 3 images to showcase your application."
        />
        <Controller
          control={control}
          name={`localisations.${selectedIndex}.showcase_img_urls`}
          render={({ field }) => (
            <ShowcaseImagesField
              value={(field.value ?? []).filter((url): url is string =>
                Boolean(url),
              )}
              onCommittedValueChange={(urls) =>
                installCommittedValue(
                  `localisations.${selectedIndex}.showcase_img_urls`,
                  urls,
                )
              }
              disabled={disabled}
              appId={appId}
              teamId={teamId ?? ""}
              locale={selectedLocale}
              isAppVerified={isAppVerified}
              appMetadataId={appMetadata.id}
              supportedLanguages={supportedLanguages}
              unverifiedImages={unverifiedImages}
              isImagesLoading={isImagesLoading}
              error={fieldErrors?.showcase_img_urls?.message}
              dropZoneClassName="h-42"
              dropZoneContent={dropZoneContent}
            />
          )}
        />
      </section>

      <section className="flex w-full flex-col gap-5">
        <SectionHeader
          title="Meta tag image"
          description="This image will be displayed as the opengraph meta tags image when linking your app. fallback to your app's logo image if not provided."
        />
        <Controller
          control={control}
          name={`localisations.${selectedIndex}.meta_tag_image_url`}
          render={({ field }) => (
            <MetaTagImageField
              value={field.value || null}
              onCommittedValueChange={(url) =>
                installCommittedValue(
                  `localisations.${selectedIndex}.meta_tag_image_url`,
                  url ?? "",
                )
              }
              disabled={disabled}
              appId={appId}
              teamId={teamId ?? ""}
              locale={selectedLocale}
              isAppVerified={isAppVerified}
              appMetadataId={appMetadata.id}
              supportedLanguages={supportedLanguages}
              unverifiedImages={unverifiedImages}
              isImagesLoading={isImagesLoading}
              error={fieldErrors?.meta_tag_image_url?.message}
              dropZoneClassName="h-42"
              dropZoneContent={dropZoneContent}
            />
          )}
        />
      </section>
    </div>
  );
};
