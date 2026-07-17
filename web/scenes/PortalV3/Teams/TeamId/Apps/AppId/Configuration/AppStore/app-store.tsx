import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useAutosaveWithStatus } from "../hook/use-autosave-with-status";
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

export const LawsAndRegulationsBanner = () => (
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

type AppStoreFormContextValue = ReturnType<typeof useAppStoreForm> &
  AppStoreFormProps & {
    isEnoughPermissions: boolean;
    supportedLanguages: string[];
  };

const AppStoreFormContext = createContext<AppStoreFormContextValue | null>(
  null,
);

const useAppStoreFormContext = () => {
  const value = useContext(AppStoreFormContext);

  if (!value) {
    throw new Error(
      "App Store fields must be rendered inside the AppStoreForm component.",
    );
  }

  return value;
};

export const AppStoreForm = ({
  appId,
  teamId,
  appMetadata,
  children,
}: PropsWithChildren<AppStoreFormProps>) => {
  const { user } = useUser() as Auth0SessionUser;

  const appStoreForm = useAppStoreForm(appId, appMetadata);
  const { control, submitSilent, isEditable } = appStoreForm;

  const form = useFormContext<AppStoreFormValues>();

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

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
    <AppStoreFormContext.Provider
      value={{
        ...appStoreForm,
        appId,
        teamId,
        appMetadata,
        isEnoughPermissions,
        supportedLanguages,
      }}
    >
      <form
        className="grid gap-y-6"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        {children}
      </form>
    </AppStoreFormContext.Provider>
  );
};

export const StoreListingFields = () => {
  const {
    appId,
    teamId,
    appMetadata,
    control,
    errors,
    supportType,
    handleSupportTypeChange,
    isEditable,
    isEnoughPermissions,
  } = useAppStoreFormContext();

  return (
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
  );
};

export const AvailabilityFields = () => {
  const { control, errors, isEditable, isEnoughPermissions } =
    useAppStoreFormContext();

  return (
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
  );
};

export const LocalizedContentFields = () => {
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
    refetchAppMetadata,
    refetchLocalisations,
  } = useAppStoreFormContext();

  return (
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
  );
};
