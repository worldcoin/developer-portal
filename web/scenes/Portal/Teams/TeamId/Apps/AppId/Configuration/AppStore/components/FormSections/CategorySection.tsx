import { CategorySelector } from "@/components/Category";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { AppStoreFormValues } from "../../FormSchema/types";
import { FormSectionProps } from "../../types/AppStoreFormTypes";

type CategorySectionProps = FormSectionProps & {
  control: Control<AppStoreFormValues>;
  errors: FieldErrors<AppStoreFormValues>;
};

export const CategorySection = ({
  control,
  errors,
  isEditable,
}: CategorySectionProps) => {
  return (
    <Controller
      name="category"
      control={control}
      render={({ field }) => (
        <CategorySelector
          value={field.value}
          required
          disabled={!isEditable}
          onChange={field.onChange}
          errors={errors.category}
          label="Category"
          variant="flat"
        />
      )}
    />
  );
};
