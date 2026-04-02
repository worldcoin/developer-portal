import { useCallback } from "react";
import { UseFormSetValue } from "react-hook-form";
import { AppStoreFormValues } from "../FormSchema/types";
import { SupportType } from "../types/AppStoreFormTypes";

export const useSupportType = (
  setValue: UseFormSetValue<AppStoreFormValues>,
) => {
  const handleSupportTypeChange = useCallback(
    (newType: SupportType) => {
      setValue("support_type", newType, { shouldDirty: true });
    },
    [setValue],
  );

  return {
    handleSupportTypeChange,
  };
};
