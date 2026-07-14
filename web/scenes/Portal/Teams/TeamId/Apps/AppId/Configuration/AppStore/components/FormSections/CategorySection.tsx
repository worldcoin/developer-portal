import { CategorySelector } from "@/components/Category";
import { useAtomValue } from "jotai";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { isMiniAppAtom } from "../../../layout/ImagesProvider";
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
  isEnoughPermissions,
}: CategorySectionProps) => {
  // Mini apps must not be listed under "External" (it hides them from the mini
  // app store), so keep that option out of the picker for mini apps.
  const isMiniApp = useAtomValue(isMiniAppAtom);

  return (
    <Controller
      name="category"
      control={control}
      render={({ field }) => (
        <CategorySelector
          value={field.value}
          required
          disabled={!isEditable || !isEnoughPermissions}
          onChange={field.onChange}
          errors={errors.category}
          label="Category"
          variant="flat"
          excludeExternal={isMiniApp}
        />
      )}
    />
  );
};
