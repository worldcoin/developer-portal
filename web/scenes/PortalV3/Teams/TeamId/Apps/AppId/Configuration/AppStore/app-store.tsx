import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useAutosaveWithStatus } from "../hook/use-autosave-with-status";
import { isMiniAppAtom } from "../layout/ImagesProvider";
import type { ConfigurationStepId } from "../PageComponents/ConfigurationWizard";
import { NumberedSection } from "../PageComponents/NumberedSection";
import { CategorySection } from "./components/FormSections/CategorySection";
import { ComplianceSection } from "./components/FormSections/ComplianceSection";
import { ContentCardImageSection } from "./components/FormSections/ContentCardImageSection";
import { CountriesSection } from "./components/FormSections/CountriesSection";
import { HumansOnlySection } from "./components/FormSections/HumansOnlySection";
import { LanguagesSection } from "./components/FormSections/LanguagesSection";
import { LocalisationsSection } from "./components/FormSections/LocalisationsSection";
import { SupportSection } from "./components/FormSections/SupportSection";
import { AppStoreFormValues } from "./FormSchema/types";
import { useAppStoreForm } from "./hooks/useAppStoreForm";
import { AppStoreFormProps } from "./types/AppStoreFormTypes";

const LawsAndRegulationsBanner = () => (
  <div className="flex items-center gap-3 rounded-[10px] bg-system-warning-100 p-5">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
      <AlertIcon className="size-4 text-white" />
    </div>
    <Typography
      variant={TYPOGRAPHY.B3}
      className="flex-1 text-system-warning-600"
    >
      Laws and regulations governing mini apps vary by country and region.
      Before launching, ensure your app complies with all relevant local rules,
      especially regarding chance-based or gambling-like features.
    </Typography>
  </div>
);

type AppStoreWizardFormProps = AppStoreFormProps & {
  activeStep: ConfigurationStepId;
};

export const AppStoreForm = ({
  appId,
  teamId,
  appMetadata,
  activeStep,
}: AppStoreWizardFormProps) => {
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
    <form
      className="grid gap-y-6"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      {isMiniApp && (
        <NumberedSection
          number="02"
          title="Store listing"
          description="Shape how your app appears when people discover it in the store."
          isActive={activeStep === "store-listing"}
        >
          <div className="grid gap-y-8">
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
          </div>
        </NumberedSection>
      )}

      <NumberedSection
        number={isMiniApp ? "03" : "02"}
        title="Availability"
        description="Choose the countries and languages where your app can launch."
        isActive={activeStep === "availability"}
        banner={isMiniApp ? <LawsAndRegulationsBanner /> : undefined}
      >
        <div className="grid gap-y-8">
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
        </div>
      </NumberedSection>

      <NumberedSection
        number={isMiniApp ? "04" : "03"}
        title="Localized content"
        description="Make your listing feel native in every language you support."
        isActive={activeStep === "localized-content"}
      >
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
      </NumberedSection>
    </form>
  );
};
