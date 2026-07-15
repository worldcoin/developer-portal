import { CategorySelector } from "@/components/Category";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  useFormContext,
  useWatch,
} from "react-hook-form";
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
  const { setValue } = useFormContext<AppStoreFormValues>();
  const category = useWatch({ control, name: "category" });

  // When an app becomes a mini app (e.g. toggled from external), its category
  // may still be "External" — a value the picker no longer offers and the
  // server rewrites to "Other". The form isn't remounted on that transition, so
  // normalize the in-memory value to match; otherwise submit-for-review stays
  // blocked by a stale, hidden "External" selection.
  useEffect(() => {
    if (
      isMiniApp &&
      typeof category === "string" &&
      category.toLowerCase() === "external"
    ) {
      setValue("category", "Other", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [isMiniApp, category, setValue]);

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
