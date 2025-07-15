import { CategorySelector } from "@/components/Category";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";
import { FormSection } from "../FormFields/FormSection";

type CategorySectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
};

export const CategorySection = ({
  control,
  errors,
  isEditable,
  isEnoughPermissions,
}: CategorySectionProps) => {
  return (
    <FormSection
      title="App category *"
      description="What category does your app fall into? Select the most relevant category. This affects display in the Mini App Store."
    >
      <div className="grid gap-y-7">
        <Controller
          name="category"
          control={control}
          render={({ field }) => {
            return (
              <CategorySelector
                value={field.value}
                required
                disabled={!isEditable || !isEnoughPermissions}
                onChange={field.onChange}
                errors={errors.category}
                label="Category"
              />
            );
          }}
        />
      </div>
    </FormSection>
  );
};
