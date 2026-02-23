import { FloatingInput } from "@/components/FloatingInput";
import { Radio } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps, SupportType } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";

type SupportSectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
  supportType: SupportType;
  onSupportTypeChange: (type: SupportType) => void;
};

export const SupportSection = ({
  control,
  errors,
  isEditable,
  isEnoughPermissions,
  supportType,
  onSupportTypeChange,
}: SupportSectionProps) => {
  const disabled = !isEditable || !isEnoughPermissions;

  return (
    <FormSection
      title="Support"
      description="Please include support information. Users will be able to reach out to you for help."
      className="grid gap-y-5"
    >
      {/* Email / Link selector */}
      <div className="flex gap-x-6">
        <Radio
          label="Email"
          value="email"
          checked={supportType === "email"}
          onChange={() => onSupportTypeChange("email")}
          disabled={disabled}
        />
        <Radio
          label="Link"
          value="link"
          checked={supportType === "link"}
          onChange={() => onSupportTypeChange("link")}
          disabled={disabled}
        />
      </div>

      {/* Single input based on selection */}
      {supportType === "email" ? (
        <Controller
          name="support_email"
          control={control}
          render={({ field }) => (
            <FloatingInput
              id="support_email"
              label="Enter email"
              value={field.value || ""}
              onChange={field.onChange}
              disabled={disabled}
              errors={errors.support_email}
            />
          )}
        />
      ) : (
        <Controller
          name="support_link"
          control={control}
          render={({ field }) => (
            <FloatingInput
              id="support_link"
              label="https://example.com"
              value={field.value || ""}
              onChange={field.onChange}
              disabled={disabled}
              errors={errors.support_link}
            />
          )}
        />
      )}
    </FormSection>
  );
};
