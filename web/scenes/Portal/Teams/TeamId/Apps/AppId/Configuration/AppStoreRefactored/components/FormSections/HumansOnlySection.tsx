import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";
import { RadioGroup } from "../FormFields/RadioGroup";

type HumansOnlySectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
};

export const HumansOnlySection = ({
  control,
  errors,
  isEditable,
  isEnoughPermissions,
}: HumansOnlySectionProps) => {
  return (
    <FormSection
      title="Is your app for verified humans only? *"
      description="Answering yes means your app leverages WorldID in a way that allows only unique human users to use the app. This will prevent non verified users from downloading the app but make you eligible for a special badge in the Mini App Store."
      className="mt-3"
    >
      <Controller
        name="is_for_humans_only"
        control={control}
        disabled={!isEditable || !isEnoughPermissions}
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onChange={field.onChange}
            disabled={!isEditable || !isEnoughPermissions}
            error={errors.is_for_humans_only}
          />
        )}
      />
    </FormSection>
  );
};
