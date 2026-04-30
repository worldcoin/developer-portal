import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useSaveStatus } from "../SaveStatus";
import { useAutosaveWithStatus } from "../hook/use-autosave-with-status";
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
import { AppStoreFormValues } from "./FormSchema/types";
import { useAppStoreForm } from "./hooks/useAppStoreForm";
import { AppStoreFormProps } from "./types/AppStoreFormTypes";

const SectionDivider = () => (
  <div className="w-full border-t border-grey-100" aria-hidden />
);

export const AppStoreForm = ({
  appId,
  teamId,
  appMetadata,
}: AppStoreFormProps) => {
  const { user } = useUser() as Auth0SessionUser;

  const {
    control,
    errors,
    localisations,
    supportType,
    handleSupportTypeChange,
    submitSilent,
    isEditable,
    refetchAppMetadata,
    refetchLocalisations,
  } = useAppStoreForm(appId, appMetadata);

  const form = useFormContext<AppStoreFormValues>();
  const { flushAll, status } = useSaveStatus();

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const isMiniApp = useAtomValue(isMiniAppAtom);

  const supportedLanguages = useWatch({ control, name: "supported_languages" });

  useAutosaveWithStatus<AppStoreFormValues>({
    id: "app-store",
    form,
    enabled: isEditable && isEnoughPermissions,
    save: async (data, signal) => {
      await submitSilent(data, signal);
    },
  });

  return (
    <div className="grid max-w-[700px] grid-cols-1fr/auto">
      <form
        className="grid gap-y-10"
        onSubmit={(event) => {
          event.preventDefault();
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

        <div className="fixed bottom-[5.25rem] z-10 md:bottom-6">
          <SaveButton
            isSubmitting={status.state === "saving"}
            isDisabled={
              !isEditable || !isEnoughPermissions || status.state === "saving"
            }
            onSubmit={() => {
              void flushAll();
            }}
          />
        </div>
      </form>
    </div>
  );
};
