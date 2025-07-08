import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMemo } from "react";
import { CategorySection } from "./components/FormSections/CategorySection";
import { ComplianceSection } from "./components/FormSections/ComplianceSection";
import { CountriesSection } from "./components/FormSections/CountriesSection";
import { HumansOnlySection } from "./components/FormSections/HumansOnlySection";
import { LanguagesSection } from "./components/FormSections/LanguagesSection";
import { LocalisationsSection } from "./components/FormSections/LocalisationsSection";
import { LogoSection } from "./components/FormSections/LogoSection";
import { SupportSection } from "./components/FormSections/SupportSection";
import { WebsiteSection } from "./components/FormSections/WebsiteSection";
import { SaveButton } from "./components/SaveButton";
import { useAppStoreForm } from "./hooks/useAppStoreForm";
import { AppStoreFormProps } from "./types/AppStoreFormTypes";

export const AppStoreFormRefactored = ({
  appId,
  teamId,
  appMetadata,
  localisationsData,
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
  } = useAppStoreForm(appId, appMetadata, localisationsData);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  return (
    <div className="mb-24 grid max-w-[580px] grid-cols-1fr/auto">
      <form className="grid gap-y-6" onSubmit={handleSubmit(submit)}>
        <LogoSection appId={appId} teamId={teamId} appMetadata={appMetadata} />

        <CategorySection
          control={control}
          errors={errors}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
        />

        <ComplianceSection
          control={control}
          errors={errors}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
        />

        <HumansOnlySection
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

        <WebsiteSection
          control={control}
          errors={errors}
          isEditable={isEditable}
          isEnoughPermissions={isEnoughPermissions}
        />

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
        />

        <SaveButton
          isSubmitting={isSubmitting}
          isDisabled={!isEditable || !isEnoughPermissions || isSubmitting}
          onSubmit={handleSubmit(submit)}
        />
      </form>
    </div>
  );
};
