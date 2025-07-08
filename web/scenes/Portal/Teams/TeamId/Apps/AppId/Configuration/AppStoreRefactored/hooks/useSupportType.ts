import { useCallback } from "react";
import { UseFormSetValue } from "react-hook-form";
import { AppStoreFormValues } from "../form-schema";
import { SupportType } from "../types/AppStoreFormTypes";

export const useSupportType = (
  setValue: UseFormSetValue<AppStoreFormValues>,
) => {
  const handleSupportTypeChange = useCallback(
    (newType: SupportType) => {
      setValue("support_type", newType, { shouldDirty: true });
      if (newType === "email") {
        setValue("support_link", "", { shouldDirty: true });
      } else {
        setValue("support_email", "", { shouldDirty: true });
      }
    },
    [setValue],
  );

  return {
    handleSupportTypeChange,
  };
};
