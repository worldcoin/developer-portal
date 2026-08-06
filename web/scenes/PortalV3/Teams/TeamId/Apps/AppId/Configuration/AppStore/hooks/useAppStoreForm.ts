import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { useApolloClient } from "@apollo/client/react";
import { useCallback, useEffect } from "react";
import {
  FieldErrors,
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { toast } from "react-toastify";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { AppStoreFormValues } from "../FormSchema/types";
import { FetchLocalisationsDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { updateAppStoreMetadata } from "../server/update-app-store";
import { AppMetadata, SupportType } from "../types/AppStoreFormTypes";
import { getFirstFormError } from "../utils/form-error-utils";
import { synchronizeLocalisationsCache } from "../utils/update-localisations-cache";
import { useSupportType } from "./useSupportType";
import {
  AppStorePersistedPatch,
  buildAppStorePersistedPatch,
} from "../../persisted-draft";

export const useAppStoreForm = (appId: string, appMetadata: AppMetadata) => {
  const isEditable = appMetadata?.verification_status === "unverified";
  const apolloClient = useApolloClient();

  const { refetch: refetchAppMetadata } = useRefetchQueries(
    FetchAppMetadataDocument,
    { id: appId },
  );
  const { refetch: refetchLocalisations } = useRefetchQueries(
    FetchLocalisationsDocument,
    { app_metadata_id: appMetadata.id },
  );

  const formContext = useFormContext<AppStoreFormValues>();
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty: _isDirty },
  } = formContext;

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

  const submitSilent = useCallback(
    async (
      data: AppStoreFormValues,
      signal?: AbortSignal,
    ): Promise<AppStorePersistedPatch> => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      // The English localisation in this form mirrors columns on app_metadata
      // (name/short_name/description/world_app_description) that BasicInformation
      // also writes. AppStore's snapshot of those fields is initialised once and
      // is NOT refreshed when BasicInformation saves a new value, so persisting
      // them unconditionally here can revert the user's BasicInformation edit.
      // Only forward en-localisation fields that the user actually dirtied in
      // *this* form; the server treats undefined fields as "leave unchanged".
      const dirtyFields = formContext.formState.dirtyFields as Record<
        string,
        unknown
      >;
      const dirtyLocalisations =
        (dirtyFields.localisations as
          | Array<Record<string, boolean>>
          | undefined) ?? [];
      const persistedPatch = buildAppStorePersistedPatch(
        data,
        dirtyLocalisations,
      );

      const result = await updateAppStoreMetadata({
        ...persistedPatch,
        app_metadata_id: appMetadata.id,
      });
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (!result.success) {
        throw new Error(result.message);
      }
      if (result.localisations) {
        synchronizeLocalisationsCache(
          apolloClient.cache,
          appMetadata.id,
          result.localisations,
        );
      }
      // Patch the Apollo cache locally instead of refetching. A network
      // round-trip would refresh every metadata consumer and look like a page
      // reload. Keep the en-localisation mirror columns current for previews.
      const en = persistedPatch.localisations.find(
        (localisation) => localisation.language === "en",
      ) as Record<string, unknown> | undefined;
      if (en) {
        apolloClient.cache.modify({
          id: apolloClient.cache.identify({
            __typename: "app_metadata",
            id: appMetadata.id,
          }),
          fields: {
            ...(en.name !== undefined && { name: () => en.name ?? "" }),
            ...(en.short_name !== undefined && {
              short_name: () => en.short_name ?? "",
            }),
            ...(en.world_app_description !== undefined && {
              world_app_description: () => en.world_app_description ?? "",
            }),
          },
        });
      }
      return persistedPatch;
    },
    [appMetadata.id, formContext, apolloClient],
  );

  const submit = useCallback(
    async (data: AppStoreFormValues) => {
      try {
        await submitSilent(data);
        toast.success("App information updated successfully");
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to update app information",
        );
      }
    },
    [submitSilent],
  );

  const onInvalid = useCallback(
    (errors: FieldErrors<AppStoreFormValues>) => {
      const errorMessage = getFirstFormError(errors, localisations);
      if (errorMessage) {
        toast.error(errorMessage);
      }
    },
    [localisations],
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
    submitSilent,
    onInvalid,
    isEditable,
    refetchAppMetadata,
    refetchLocalisations,
  };
};
