import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { Controller, useWatch } from "react-hook-form";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import { CategorySection } from "./components/FormSections/CategorySection";
import { ComplianceSection } from "./components/FormSections/ComplianceSection";
import { ContentCardImageSection } from "./components/FormSections/ContentCardImageSection";
import { CountriesSection } from "./components/FormSections/CountriesSection";
import { HumansOnlySection } from "./components/FormSections/HumansOnlySection";
import { LanguagesSection } from "./components/FormSections/LanguagesSection";
import { LocalisationsSection } from "./components/FormSections/LocalisationsSection";
import { SupportSection } from "./components/FormSections/SupportSection";
import { FormSection } from "./components/FormFields/FormSection";
import { MetaTagImageField } from "./ImageForm/MetaTagImageField";
import { ShowcaseImagesField } from "./ImageForm/ShowcaseImagesField";
import { SaveButton } from "./components/SaveButton";
import { useAppStoreForm } from "./hooks/useAppStoreForm";
import { AppStoreFormProps } from "./types/AppStoreFormTypes";

export const AppStoreForm = ({
  appId,
  teamId,
  appMetadata,
  onBeforeSave,
}: AppStoreFormProps) => {
  const { user } = useUser() as Auth0SessionUser;

  const {
    control,
    handleSubmit,
    errors,
    isSubmitting,
    localisations,
    supportType,
    handleSupportTypeChange,
    submit,
    isEditable,
    onInvalid,
  } = useAppStoreForm(appId, appMetadata);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const isMiniApp = useAtomValue(isMiniAppAtom);

  const supportedLanguages = useWatch({ control, name: "supported_languages" });
  const firstLocale = localisations[0]?.language ?? "en";

  return (
    <div className="grid max-w-[700px] grid-cols-1fr/auto">
      <form
        className="grid gap-y-10"
        onSubmit={handleSubmit(submit, onInvalid)}
      >
        {isMiniApp && (
          <>
            <ComplianceSection
              control={control}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
            />

            <HumansOnlySection
              control={control}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
            />

            <CategorySection
              control={control}
              errors={errors}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
            />

            <SupportSection
              control={control}
              errors={errors}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
              supportType={supportType}
              onSupportTypeChange={handleSupportTypeChange}
            />

            <ContentCardImageSection
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
              errors={errors}
            />
          </>
        )}

        <CountriesSection
          control={control}
          errors={errors}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
        />

        <LanguagesSection
          control={control}
          errors={errors}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
        />

        <LocalisationsSection
          control={control}
          errors={errors}
          localisations={localisations}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
          appMetadata={appMetadata}
        />

        {localisations.length > 0 && (
          <FormSection
            title="Showcase Images"
            description="Upload up to 3 images to showcase your application."
          >
            <Controller
              control={control}
              name="localisations.0.showcase_img_urls"
              render={({ field }) => (
                <ShowcaseImagesField
                  value={(field.value || []).filter((url): url is string =>
                    Boolean(url),
                  )}
                  onChange={field.onChange}
                  disabled={!isEditable || !isEnoughPermissions}
                  appId={appId}
                  teamId={teamId}
                  locale={firstLocale}
                  isAppVerified={appMetadata.verification_status === "verified"}
                  appMetadataId={appMetadata.id}
                  supportedLanguages={supportedLanguages}
                  onAutosaveSuccess={() => {}}
                  onAutosaveError={() => {}}
                />
              )}
            />
          </FormSection>
        )}

        {localisations.length > 0 && (
          <FormSection
            title="Meta Tag Image"
            description="This image will be displayed as the opengraph meta tags image when linking your app. Fallback to your app's logo image if not provided."
            isRequiredAsterisk={false}
          >
            <Controller
              control={control}
              name="localisations.0.meta_tag_image_url"
              render={({ field }) => (
                <MetaTagImageField
                  value={field.value}
                  onChange={field.onChange}
                  disabled={!isEditable || !isEnoughPermissions}
                  appId={appId}
                  teamId={teamId}
                  locale={firstLocale}
                  isAppVerified={appMetadata.verification_status === "verified"}
                  appMetadataId={appMetadata.id}
                  supportedLanguages={supportedLanguages}
                  onAutosaveSuccess={() => {}}
                  onAutosaveError={() => {}}
                />
              )}
            />
          </FormSection>
        )}

        <SaveButton
          isSubmitting={isSubmitting}
          isDisabled={!isEditable || !isEnoughPermissions || isSubmitting}
          onSubmit={async () => {
            await onBeforeSave?.();
            handleSubmit(submit, onInvalid)();
          }}
        />
      </form>
    </div>
  );
};
