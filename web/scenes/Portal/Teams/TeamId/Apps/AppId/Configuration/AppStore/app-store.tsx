import { RestrictedAction } from "@/components/RestrictedAction";
import { useTeamPermission } from "@/lib/team-permissions/use-team-permission";
import { useAtomValue } from "jotai";
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
import { SaveStatusIndicator } from "../SaveStatus";
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
  // Read displayStatus (debounced/held view of the save state) so the button
  // tracks the indicator's visible "Saving…" pill — disabling and changing
  // copy only while the blue pill is showing, not on every raw status flip.
  const { flushAll, displayStatus } = useSaveStatus();

  const editStorePerm = useTeamPermission(teamId, "edit_app_store_details");
  const savePerm = useTeamPermission(teamId, "save_app_configuration");

  const isMiniApp = useAtomValue(isMiniAppAtom);
  const canEditStore = isEditable && editStorePerm.allowed;

  const supportedLanguages = useWatch({ control, name: "supported_languages" });

  useAutosaveWithStatus<AppStoreFormValues>({
    id: "app-store",
    form,
    enabled: canEditStore,
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
            <ComplianceSection control={control} isEditable={canEditStore} />

            <HumansOnlySection control={control} isEditable={canEditStore} />

            <CategorySection
              control={control}
              errors={errors}
              isEditable={canEditStore}
            />

            <SectionDivider />

            <SupportSection
              control={control}
              errors={errors}
              isEditable={canEditStore}
              supportType={supportType}
              onSupportTypeChange={handleSupportTypeChange}
            />

            <SectionDivider />

            <ContentCardImageSection
              appId={appId}
              teamId={teamId}
              appMetadata={appMetadata}
              isEditable={canEditStore}
              errors={errors}
            />

            <SectionDivider />
          </>
        )}

        <CountriesSection
          control={control}
          errors={errors}
          isEditable={canEditStore}
        />

        <SectionDivider />

        <LanguagesSection
          control={control}
          errors={errors}
          isEditable={canEditStore}
        />

        <SectionDivider />

        <LocalisationsSection
          control={control}
          errors={errors}
          localisations={localisations}
          isEditable={canEditStore}
          appMetadata={appMetadata}
          appId={appId}
          teamId={teamId}
          supportedLanguages={supportedLanguages}
          onAutosaveSuccess={() => {
            refetchAppMetadata();
            refetchLocalisations();
          }}
        />

        <div className="fixed bottom-[5.25rem] right-6 z-10 flex items-center gap-x-3 md:bottom-6">
          <SaveStatusIndicator />
          <RestrictedAction restriction={savePerm}>
            {({ disabled }) => (
              <SaveButton
                isSubmitting={displayStatus.state === "saving"}
                isDisabled={
                  !isEditable || disabled || displayStatus.state === "saving"
                }
                onSubmit={() => {
                  void flushAll();
                }}
              />
            )}
          </RestrictedAction>
        </div>
      </form>
    </div>
  );
};
