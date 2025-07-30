import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { useCallback, useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import { FetchAppMetadataDocument } from "../../graphql/client/fetch-app-metadata.generated";
import { AppStoreFormValues } from "../FormSchema/types";
import { FetchLocalisationsDocument } from "../graphql/client/fetch-localisations.generated";
import { updateAppStoreMetadata } from "../server/update-app-store";
import { AppMetadata, SupportType } from "../types/AppStoreFormTypes";
import { useSupportType } from "./useSupportType";

export const useAppStoreForm = (appId: string, appMetadata: AppMetadata) => {
  const isEditable = appMetadata?.verification_status === "unverified";

  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    { id: appId },
  );
  const { refetch: refetchLocalisations } = useRefetchQueries(
    FetchLocalisationsDocument,
    { app_metadata_id: appMetadata.id },
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty: _isDirty },
  } = useFormContext<AppStoreFormValues>();

  const {
    fields: localisations,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "localisations",
  });

  const supportedLanguages = useWatch({
    control,
    name: "supported_languages",
  });

  const supportType = (watch("support_type") as SupportType) || "email";

  const { handleSupportTypeChange } = useSupportType(setValue);

  // sync localisations with supported_languages
  useEffect(() => {
    if (supportedLanguages) {
      const currentLanguages = localisations.map((field) => field.language);
      const newLanguages = supportedLanguages.filter(
        (lang) => !currentLanguages.includes(lang),
      );
      const removedLanguages = currentLanguages.filter(
        (lang) => !supportedLanguages.includes(lang),
      );

      // remove localisations for removed languages
      removedLanguages.forEach((lang) => {
        const index = localisations.findIndex(
          (field) => field.language === lang,
        );
        if (index !== -1) {
          remove(index);
        }
      });

      // add localisations for new languages
      newLanguages.forEach((lang) => {
        append({
          language: lang,
          name: "",
          short_name: "",
          world_app_description: "",
          description_overview: "",
          meta_tag_image_url: "",
          showcase_img_urls: [],
        });
      });
    }
  }, [supportedLanguages, localisations, append, remove]);

  const submit = useCallback(
    async (data: AppStoreFormValues) => {
      const result = await updateAppStoreMetadata({
        ...data,
        app_metadata_id: appMetadata.id,
      });

      if (!result.success) {
        toast.error(result.message);
      } else {
        await Promise.all([refetchAppMetadata(), refetchLocalisations()]);
        toast.success("App information updated successfully");
      }
      toast.update("formState", { autoClose: 0 });
    },
    [appMetadata.id, refetchAppMetadata, refetchLocalisations],
  );

  return {
    control,
    handleSubmit,
    watch,
    setValue,
    errors,
    isSubmitting,
    localisations,
    supportType,
    handleSupportTypeChange,
    submit,
    isEditable,
  };
};
