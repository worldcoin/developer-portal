import { Link } from "@/components/Link";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../form-schema";
import { FormSectionProps } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";
import { RadioGroup } from "../FormFields/RadioGroup";

type ComplianceSectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
};

export const ComplianceSection = ({
  control,
  errors,
  isEditable,
  isEnoughPermissions,
}: ComplianceSectionProps) => {
  return (
    <FormSection
      title="Compliance *"
      description={
        <>
          Does your app have functionality that might potentially be construed
          as gambling or the purchase of digital in game items as{" "}
          <Link
            href="https://developer.apple.com/app-store/review/guidelines/#business"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            defined by Apple here
          </Link>
          ?
        </>
      }
    >
      <Controller
        name="is_android_only"
        control={control}
        disabled={!isEditable || !isEnoughPermissions}
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onChange={field.onChange}
            disabled={!isEditable || !isEnoughPermissions}
            error={errors.is_android_only}
          />
        )}
      />
    </FormSection>
  );
};
