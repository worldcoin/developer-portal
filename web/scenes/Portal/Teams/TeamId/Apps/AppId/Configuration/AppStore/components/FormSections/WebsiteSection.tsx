import { Input } from "@/components/Input";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";

type WebsiteSectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
};

export const WebsiteSection = ({
  control,
  errors,
  isEditable,
  isEnoughPermissions,
}: WebsiteSectionProps) => {
  return (
    <FormSection
      title="App website"
      description="Enter the URL of your App's website, e.g. a landing page."
    >
      <Controller
        name="app_website_url"
        control={control}
        render={({ field }) => (
          <Input
            label="Official website"
            errors={errors.app_website_url}
            required
            disabled={!isEditable || !isEnoughPermissions}
            placeholder="https://"
            value={field.value || ""}
            onChange={field.onChange}
          />
        )}
      />
    </FormSection>
  );
};
