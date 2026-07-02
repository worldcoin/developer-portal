"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Control, FieldArrayWithId, FieldErrors } from "react-hook-form";
import { CountriesSection } from "../../AppStore/components/FormSections/CountriesSection";
import { LanguagesSection } from "../../AppStore/components/FormSections/LanguagesSection";
import { LocalisationsSection } from "../../AppStore/components/FormSections/LocalisationsSection";
import { AppStoreFormValues } from "../../AppStore/FormSchema/types";
import { AppMetadata } from "../../AppStore/types/AppStoreFormTypes";

type LocalizationStepProps = {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
  localisations: FieldArrayWithId<AppStoreFormValues, "localisations", "id">[];
  appMetadata: AppMetadata;
  appId: string;
  teamId: string;
  isEditable: boolean;
  isEnoughPermissions: boolean;
  supportedLanguages: string[];
  onAutosaveSuccess: () => void;
};

/**
 * Step 5 — supported countries + languages, and per-locale localized content.
 * Reuses the same three sections that the classic AppStore form stacks.
 */
export const LocalizationStep = ({
  control,
  errors,
  localisations,
  appMetadata,
  appId,
  teamId,
  isEditable,
  isEnoughPermissions,
  supportedLanguages,
  onAutosaveSuccess,
}: LocalizationStepProps) => {
  return (
    <div className="grid gap-y-10">
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6} className="font-normal">
          Availability &amp; localization
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Add countries and languages. Localized taglines and descriptions can
          boost engagement.
        </Typography>
      </div>

      <CountriesSection
        control={control}
        errors={errors}
        isEditable={isEditable}
        isEnoughPermissions={isEnoughPermissions}
      />

      <div className="w-full border-t border-grey-100" aria-hidden />

      <LanguagesSection
        control={control}
        errors={errors}
        isEditable={isEditable}
        isEnoughPermissions={isEnoughPermissions}
      />

      <div className="w-full border-t border-grey-100" aria-hidden />

      <LocalisationsSection
        control={control}
        errors={errors}
        localisations={localisations}
        appMetadata={appMetadata}
        appId={appId}
        teamId={teamId}
        isEditable={isEditable}
        isEnoughPermissions={isEnoughPermissions}
        supportedLanguages={supportedLanguages}
        onAutosaveSuccess={onAutosaveSuccess}
      />
    </div>
  );
};
