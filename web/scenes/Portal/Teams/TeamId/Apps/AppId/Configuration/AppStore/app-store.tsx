import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import { CategorySection } from "./components/FormSections/CategorySection";
import { ComplianceSection } from "./components/FormSections/ComplianceSection";
import { ContentCardImageSection } from "./components/FormSections/ContentCardImageSection";
import { CountriesSection } from "./components/FormSections/CountriesSection";
import { HumansOnlySection } from "./components/FormSections/HumansOnlySection";
import { LanguagesSection } from "./components/FormSections/LanguagesSection";
import { LocalisationsSection } from "./components/FormSections/LocalisationsSection";
import { SupportSection } from "./components/FormSections/SupportSection";
import { SaveButton } from "./components/SaveButton";
import { useAppStoreForm } from "./hooks/useAppStoreForm";
import { AppStoreFormProps } from "./types/AppStoreFormTypes";

const SectionDivider = () => (
  <div className="w-full border-t border-grey-100" aria-hidden />
);

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
    watch,
    setValue,
    isEditable,
    onInvalid,
    refetchAppMetadata,
    refetchLocalisations,
  } = useAppStoreForm(appId, appMetadata);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const isMiniApp = useAtomValue(isMiniAppAtom);

  const supportedLanguages = useWatch({ control, name: "supported_languages" });
  const guardedSubmit = async () => {
    const canProceed = await onBeforeSave?.();
    if (canProceed === false) return;

    const currentSupportType = watch("support_type");
    if (currentSupportType === "email") {
      setValue("support_link", "", {
        shouldDirty: true,
        shouldValidate: false,
      });
    } else if (currentSupportType === "link") {
      setValue("support_email", "", {
        shouldDirty: true,
        shouldValidate: false,
      });
    }

    handleSubmit(submit, onInvalid)();
  };

  return (
    <div className="grid max-w-[700px] grid-cols-1fr/auto">
      <form
        className="grid gap-y-10"
        onSubmit={(event) => {
          event.preventDefault();
          void guardedSubmit();
        }}
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

            <SectionDivider />

            <SupportSection
              control={control}
              errors={errors}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
              supportType={supportType}
              onSupportTypeChange={handleSupportTypeChange}
            />

            <SectionDivider />

            <ContentCardImageSection
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
              isEditable={isEditable}
              isEnoughPermissions={isEnoughPermissions}
              errors={errors}
            />

            <SectionDivider />
          </>
        )}

        <CountriesSection
          control={control}
          errors={errors}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
        />

        <SectionDivider />

        <LanguagesSection
          control={control}
          errors={errors}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
        />

        <SectionDivider />

        <LocalisationsSection
          control={control}
          errors={errors}
          localisations={localisations}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
          appMetadata={appMetadata}
          appId={appId}
          teamId={teamId}
          supportedLanguages={supportedLanguages}
          onAutosaveSuccess={() => {
            refetchAppMetadata();
            refetchLocalisations();
          }}
        />

        <SaveButton
          isSubmitting={isSubmitting}
          isDisabled={!isEditable || !isEnoughPermissions || isSubmitting}
          onSubmit={guardedSubmit}
        />
      </form>
    </div>
  );
};
