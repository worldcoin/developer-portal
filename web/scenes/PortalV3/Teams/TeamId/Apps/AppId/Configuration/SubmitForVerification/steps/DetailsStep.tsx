"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Control, FieldErrors } from "react-hook-form";
import { CategorySection } from "../../AppStore/components/FormSections/CategorySection";
import { ComplianceSection } from "../../AppStore/components/FormSections/ComplianceSection";
import { LocalisationFields } from "../../AppStore/components/FormSections/LocalisationsSection/components/LocalisationFields";
import { HumansOnlySection } from "../../AppStore/components/FormSections/HumansOnlySection";
import { SupportSection } from "../../AppStore/components/FormSections/SupportSection";
import { AppStoreFormValues } from "../../AppStore/FormSchema/types";
import { SupportType } from "../../AppStore/types/AppStoreFormTypes";

type DetailsStepProps = {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
  enIndex: number;
  isEditable: boolean;
  isEnoughPermissions: boolean;
  isMiniApp: boolean;
  supportType: SupportType;
  onSupportTypeChange: (type: SupportType) => void;
};

/**
 * Step 3 — the app description (name / tagline / overview) for the primary
 * locale, plus the remaining mini-app detail sections (category, support,
 * compliance) so nothing required at review time is hidden from the wizard.
 */
export const DetailsStep = ({
  control,
  errors,
  enIndex,
  isEditable,
  isEnoughPermissions,
  isMiniApp,
  supportType,
  onSupportTypeChange,
}: DetailsStepProps) => {
  return (
    <div className="grid gap-y-10">
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6} className="font-normal">
          Description
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Tell people what your app is about.
        </Typography>
      </div>

      <LocalisationFields
        control={control}
        errors={errors}
        selectedIndex={enIndex}
        isEditable={isEditable}
        isEnoughPermissions={isEnoughPermissions}
        isMiniApp={isMiniApp}
      />

      {isMiniApp && (
        <>
          <div className="w-full border-t border-grey-100" aria-hidden />

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
            onSupportTypeChange={onSupportTypeChange}
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
        </>
      )}
    </div>
  );
};
