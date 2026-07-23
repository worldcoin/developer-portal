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

export const BasicInformation = forwardRef<
  BasicInformationHandle,
  {
    appId: string;
    teamId: string;
    app: FetchAppMetadataQuery["app"][0];
    teamName: string;
    isMiniApp: boolean;
  }
>(({ appId, teamId, app, teamName, isMiniApp }, ref) => {
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
      world_app_description:
        appMetaData?.app_mode === "mini-app"
          ? appMetaData?.world_app_description ?? ""
          : undefined,
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
    setBasicInfoDraft(form.getValues());
    const subscription = watch((values) => {
      setBasicInfoDraft({
        name: values.name,
        world_app_description: values.world_app_description,
        integration_url: values.integration_url,
        app_website_url: values.app_website_url,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, watch, setBasicInfoDraft]);

  const persist = useCallback(
    async (
      data: BasicInformationFormValues,
      signal?: AbortSignal,
    ): Promise<boolean> => {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const submittedData = isMiniApp
        ? data
        : { ...data, world_app_description: undefined };
      const result = await validateAndSubmitServerSide(
        appMetaData?.id,
        appId,
        submittedData,
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
            ...(data.name !== undefined && {
              name: () => data.name ?? "",
            }),
            ...(submittedData.world_app_description !== undefined && {
              world_app_description: () =>
                submittedData.world_app_description ?? "",
            }),
            ...(data.integration_url !== undefined && {
              integration_url: () => data.integration_url ?? "",
            }),
            ...(data.app_website_url !== undefined && {
              app_website_url: () => data.app_website_url ?? "",
            }),
          },
        });
      }
      return true;
    },
    [appMetaData?.id, appId, apolloClient, isMiniApp],
  );

  const autosave = useAutosaveWithStatus<BasicInformationFormValues>({
    id: "basic-information",
    form,
    enabled: isEditable && isEnoughPermissions,
    save: async (data, signal) => {
      await persist(data, signal);
    },
  });

  useImperativeHandle(ref, () => ({
    submit: (opts) =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          async (data) => {
            if (opts?.forReview) {
              try {
                await reviewSchema.validate(data, {
                  abortEarly: false,
                  context: {
                    isMiniApp,
                  },
                });
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
  }));

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

  return (
    <div className="grid gap-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={isMiniApp ? undefined : "sm:col-span-2"}>
          <FloatingInput
            id="name"
            register={register("name")}
            errors={errors.name}
            label="App name"
            disabled={!isEditable || !isEnoughPermissions}
            required
            maxLength={50}
          />
        </div>

        {isMiniApp && (
          <FloatingInput
            id="world_app_description"
            register={register("world_app_description")}
            errors={errors.world_app_description}
            label="App Tag Line"
            disabled={!isEditable || !isEnoughPermissions}
            required
            maxLength={40}
          />
        )}

        <div className="sm:col-span-2">
          <FloatingInput
            id="integration_url"
            label="App URL"
            required
            errors={errors.integration_url}
            disabled={!isEditable || !isEnoughPermissions}
            register={makeUrlRegister("integration_url")}
          />
        </div>

        <div className="sm:col-span-2">
          <FloatingInput
            id="app_website_url"
            label="App Official Website"
            required
            errors={errors.app_website_url}
            disabled={!isEditable || !isEnoughPermissions}
            register={makeUrlRegister("app_website_url")}
          />
        </div>
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
