import { Input } from "@/components/Input";
import { Radio } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { SUPPORT_CONTACT_TEST_NAME } from "../../FormSchema/form-schema";
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
  const specialFieldError = Object.entries(errors).find(
    ([_, value]) => value?.type === SUPPORT_CONTACT_TEST_NAME,
  )?.[1]?.message;

  return (
    <FormSection
      title="Support"
      description="Please include a support link where users can reach out to you for help."
      className="grid gap-y-5"
    >
      <div className="grid grid-cols-2 gap-x-4">
        <div>
          <div className="grid grid-cols-auto/1fr gap-x-2 pb-2">
            <Radio
              value={"email"}
              checked={supportType === "email"}
              onChange={() => onSupportTypeChange("email")}
            />
            <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
              Email
            </Typography>
          </div>
          <Controller
            name="support_email"
            control={control}
            render={({ field }) => (
              <Input
                disabled={
                  !isEditable || !isEnoughPermissions || supportType !== "email"
                }
                placeholder="address@example.com"
                value={field.value || ""}
                onChange={field.onChange}
                errors={errors.support_email}
              />
            )}
          />
        </div>
        <div>
          <div className="grid grid-cols-auto/1fr gap-x-2 pb-2">
            <Radio
              value={"link"}
              checked={supportType === "link"}
              onChange={() => onSupportTypeChange("link")}
            />
            <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
              Link
            </Typography>
          </div>
          <Controller
            name="support_link"
            control={control}
            render={({ field }) => (
              <Input
                disabled={
                  !isEditable || !isEnoughPermissions || supportType !== "link"
                }
                placeholder="https://"
                value={field.value || ""}
                onChange={field.onChange}
                errors={errors.support_link}
              />
            )}
          />
        </div>
        <span className="mt-2 text-xs text-system-error-500">
          {specialFieldError}
        </span>
      </div>
    </FormSection>
  );
};
