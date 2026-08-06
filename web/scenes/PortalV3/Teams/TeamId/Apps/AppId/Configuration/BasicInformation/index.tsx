"use client";
import { CopyButton } from "@/components/CopyButton";
import { FloatingInput } from "@/components/FloatingInput";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { inferHttps } from "@/lib/schema";
import { checkUserPermissions } from "@/lib/utils";
import { useApolloClient } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { atom, useAtom, useSetAtom } from "jotai";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../layout/ImagesProvider";
import * as yup from "yup";
import { useAutosaveWithStatus } from "../hook/use-autosave-with-status";
import {
  BasicInformationFormValues,
  reviewSchema,
  schema,
} from "./form-schema";
import { validateAndSubmitServerSide } from "./server/submit";

export type BasicInformationHandle = {
  submit: (opts?: {
    silent?: boolean;
    forReview?: boolean;
  }) => Promise<boolean>;
};

// Live snapshot of this form's values, published as the user types. The preview
// consumes it because this local useForm is separate from the App Store form
// context; without the atom, the preview would update only after autosave lands
// in the Apollo cache.
export const basicInfoDraftAtom = atom<Partial<BasicInformationFormValues>>({});

/**
 * Owns the basic-information form: seeding from the active metadata row,
 * autosave (id "basic-information"), the imperative submit used by the
 * review flow, and the live-draft atom. Shared between the section component
 * below and the configuration wizard's designed step, so both surfaces
 * persist through the exact same path.
 */
export const useBasicInformationForm = ({
  appId,
  teamId,
  app,
  managesName = true,
  onSavedEdit,
}: {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
  managesName?: boolean;
  onSavedEdit?: (patch: Partial<BasicInformationFormValues>) => void;
}) => {
  const apolloClient = useApolloClient();

  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;
  const setBasicInfoDraft = useSetAtom(basicInfoDraftAtom);

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const appMetaData = useMemo(() => {
    const draftMetadata = app.app_metadata?.[0];
    const verifiedMetadata = app.verified_app_metadata[0];

    if (viewMode === "verified") {
      return verifiedMetadata ?? draftMetadata;
    }

    return draftMetadata ?? verifiedMetadata;
  }, [app, viewMode]);

  const isEditable = appMetaData?.verification_status === "unverified";

  const editableAppMetadata = useMemo(() => {
    return {
      name: appMetaData?.name,
      integration_url: appMetaData?.integration_url,
      app_website_url: appMetaData?.app_website_url ?? "",
    };
  }, [appMetaData]);
  const previousMetadataId = useRef<string | undefined>(appMetaData?.id);

  const form = useForm<BasicInformationFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      ...editableAppMetadata,
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = form;

  // Reset form values only when the metadata context changes (e.g. version switch),
  // not on same-row refetches from image/toggle mutations.
  useEffect(() => {
    if (previousMetadataId.current !== appMetaData?.id) {
      reset({
        ...editableAppMetadata,
      });
      previousMetadataId.current = appMetaData?.id;
    }
  }, [appMetaData?.id, editableAppMetadata, reset]);

  // Publish live values for the live preview.
  useEffect(() => {
    const initialValues = form.getValues();
    setBasicInfoDraft({
      name: managesName ? initialValues.name : undefined,
      integration_url: initialValues.integration_url,
      app_website_url: initialValues.app_website_url,
    });
    const subscription = watch((values) => {
      setBasicInfoDraft({
        name: managesName ? values.name : undefined,
        integration_url: values.integration_url,
        app_website_url: values.app_website_url,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, managesName, watch, setBasicInfoDraft]);

  const persist = useCallback(
    async (
      data: BasicInformationFormValues,
      signal?: AbortSignal,
    ): Promise<Partial<BasicInformationFormValues>> => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const persistedPatch: Partial<BasicInformationFormValues> = managesName
        ? data
        : {
            integration_url: data.integration_url,
            app_website_url: data.app_website_url,
          };
      const result = await validateAndSubmitServerSide(
        appMetaData?.id,
        appId,
        persistedPatch,
      );
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (!result.success) {
        throw new Error(result.message);
      }
      // Patch the Apollo cache so previews and other dependent surfaces update
      // instantly, without the flicker of a full metadata refetch.
      if (appMetaData?.id) {
        apolloClient.cache.modify({
          id: apolloClient.cache.identify({
            __typename: "app_metadata",
            id: appMetaData.id,
          }),
          fields: {
            ...(persistedPatch.name !== undefined && {
              name: () => persistedPatch.name ?? "",
            }),
            ...(persistedPatch.integration_url !== undefined && {
              integration_url: () => persistedPatch.integration_url ?? "",
            }),
            ...(persistedPatch.app_website_url !== undefined && {
              app_website_url: () => persistedPatch.app_website_url ?? "",
            }),
          },
        });
      }
      return persistedPatch;
    },
    [appMetaData?.id, appId, apolloClient, managesName],
  );

  const autosave = useAutosaveWithStatus<
    BasicInformationFormValues,
    Partial<BasicInformationFormValues>
  >({
    id: "basic-information",
    form,
    enabled: isEditable && isEnoughPermissions,
    save: async (data, signal) => {
      return persist(data, signal);
    },
    onSavedEdit,
  });

  const submit = useCallback(
    (opts?: { silent?: boolean; forReview?: boolean }) =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          async (data) => {
            if (opts?.forReview) {
              try {
                await (
                  managesName ? reviewSchema : reviewSchema.omit(["name"])
                ).validate(data, { abortEarly: false });
              } catch (err) {
                if (err instanceof yup.ValidationError) {
                  err.inner.forEach((e) => {
                    if (e.path) {
                      setError(e.path as keyof BasicInformationFormValues, {
                        message: e.message,
                      });
                    }
                  });
                  resolve(false);
                  return;
                }
              }
            }
            const flushed = await autosave.flush();
            if (!flushed) {
              resolve(false);
              return;
            }
            if (!opts?.silent) {
              toast.success("App information updated successfully");
            }
            resolve(true);
          },
          () => resolve(false),
        )();
      }),
    [autosave, handleSubmit, managesName, setError],
  );

  const makeUrlRegister = useCallback(
    (
      fieldName: "integration_url" | "app_website_url",
    ): ReturnType<typeof register> => {
      const base = register(fieldName);
      return {
        ...base,
        onBlur: async (e) => {
          await base.onBlur(e);
          const val = (e.target as HTMLInputElement).value;
          const inferred = inferHttps(val);
          if (inferred !== val) {
            setValue(fieldName, inferred, { shouldValidate: true });
          }
        },
      };
    },
    [register, setValue],
  );

  return {
    form,
    errors,
    isEditable,
    isEnoughPermissions,
    makeUrlRegister,
    submit,
  };
};

export const BasicInformation = forwardRef<
  BasicInformationHandle,
  {
    appId: string;
    teamId: string;
    app: FetchAppMetadataQuery["app"][0];
    teamName: string;
  }
>(({ appId, teamId, app, teamName }, ref) => {
  const {
    form,
    errors,
    isEditable,
    isEnoughPermissions,
    makeUrlRegister,
    submit,
  } = useBasicInformationForm({ appId, teamId, app });
  const { register } = form;

  useImperativeHandle(ref, () => ({ submit }), [submit]);

  return (
    <div className="grid gap-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FloatingInput
          id="name"
          register={register("name")}
          errors={errors.name}
          label="App name"
          disabled={!isEditable || !isEnoughPermissions}
          required
          maxLength={50}
        />

        <FloatingInput
          id="integration_url"
          label="App URL"
          required
          errors={errors.integration_url}
          disabled={!isEditable || !isEnoughPermissions}
          register={makeUrlRegister("integration_url")}
        />

        <FloatingInput
          id="app_website_url"
          label="App Official Website"
          required
          errors={errors.app_website_url}
          disabled={!isEditable || !isEnoughPermissions}
          register={makeUrlRegister("app_website_url")}
        />
      </div>

      {/* Publisher / ID meta line */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Publisher: {teamName}
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-300">
          ·
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          ID: {appId}
        </Typography>
        <CopyButton fieldName="App ID" fieldValue={appId} />
      </div>
    </div>
  );
});

BasicInformation.displayName = "BasicInformation";
