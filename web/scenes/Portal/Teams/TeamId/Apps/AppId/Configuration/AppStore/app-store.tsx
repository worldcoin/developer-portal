import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { FieldPath, useFormContext, useWatch } from "react-hook-form";
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
  const { user } = useUser() as Auth0SessionUser;

  const {
    control,
    errors,
    localisations,
    supportType,
    handleSupportTypeChange,
    submitSilent,
    isEditable,
  } = useAppStoreForm(appId, appMetadata);

  const form = useFormContext<AppStoreFormValues>();
  // Read displayStatus (debounced/held view of the save state) so the button
  // tracks the indicator's visible "Saving…" pill — disabling and changing
  // copy only while the blue pill is showing, not on every raw status flip.
  const { flushAll, displayStatus } = useSaveStatus();

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const isMiniApp = useAtomValue(isMiniAppAtom);

  const supportedLanguages = useWatch({ control, name: "supported_languages" });

  const { runWithoutAutosave } = useAutosaveWithStatus<AppStoreFormValues>({
    id: "app-store",
    form,
    enabled: isEditable && isEnoughPermissions,
    save: async (data, signal) => {
      await submitSilent(data, signal);
    },
  });

  const { setValue } = form;
  const installCommittedValue = useCallback(
    (name: FieldPath<AppStoreFormValues>, value: unknown) => {
      runWithoutAutosave(() => {
        // Not dirty: the dedicated image mutation is the persistence owner,
        // so the general autosave must not re-save (or block on) this field.
        setValue(name, value as never, {
          shouldValidate: true,
          shouldDirty: false,
          shouldTouch: false,
        });
      });
    },
    [runWithoutAutosave, setValue],
  );

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
          installCommittedValue={installCommittedValue}
        />

        <div className="fixed right-6 bottom-21 z-10 flex items-center gap-x-3 md:bottom-6">
          <SaveStatusIndicator />
          <SaveButton
            isSubmitting={displayStatus.state === "saving"}
            isDisabled={
              !isEditable ||
              !isEnoughPermissions ||
              displayStatus.state === "saving"
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
