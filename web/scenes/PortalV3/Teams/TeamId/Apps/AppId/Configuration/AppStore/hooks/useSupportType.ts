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
      // The schema requires the inactive support field to be empty (length 0).
      // Without clearing it here, a previously saved link/email lingers in form
      // state and blocks validation — and therefore autosave — until cleared.
      const fieldToClear =
        newType === "email" ? "support_link" : "support_email";
      setValue(fieldToClear, "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue],
  );

  return {
    handleSupportTypeChange,
  };
};
