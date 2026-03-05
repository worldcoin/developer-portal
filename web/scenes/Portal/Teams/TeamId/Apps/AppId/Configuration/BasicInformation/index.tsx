"use client";
import { CopyButton } from "@/components/CopyButton";
import { FloatingInput } from "@/components/FloatingInput";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { inferHttps } from "@/lib/schema";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
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
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
  FetchAppMetadataQueryVariables,
} from "../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../layout/ImagesProvider";
import * as yup from "yup";
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

export const BasicInformation = forwardRef<
  BasicInformationHandle,
  {
    appId: string;
    teamId: string;
    app: FetchAppMetadataQuery["app"][0];
    teamName: string;
  }
>(({ appId, teamId, app, teamName }, ref) => {
  const { refetch: refetchAppMetadata } =
    useRefetchQueries<FetchAppMetadataQueryVariables>(
      FetchAppMetadataDocument,
      { id: appId },
    );

  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const appMetaData = useMemo(() => {
    if (viewMode === "verified") {
      return app.verified_app_metadata[0];
    } else {
      // Null check in case app got verified and has no unverified metadata
      return app.app_metadata?.[0] ?? app.verified_app_metadata[0];
    }
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isDirty, isValid },
  } = useForm<BasicInformationFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      ...editableAppMetadata,
    },
  });

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

  const submit = useCallback(
    (opts?: { silent?: boolean }) =>
      async (data: BasicInformationFormValues): Promise<boolean> => {
        const result = await validateAndSubmitServerSide(
          appMetaData?.id,
          appId,
          data,
        );
        if (!result.success) {
          toast.error(result.message);
          return false;
        } else {
          await refetchAppMetadata();
          reset(data);
          if (!opts?.silent) {
            toast.success("App information updated successfully");
          }
          return true;
        }
      },
    [appMetaData?.id, appId, refetchAppMetadata, reset],
  );

  useImperativeHandle(ref, () => ({
    submit: (opts) =>
      new Promise<boolean>((resolve) => {
        handleSubmit(
          async (data) => {
            if (opts?.forReview) {
              try {
                await reviewSchema.validate(data, { abortEarly: false });
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
            const ok = await submit(opts)(data);
            resolve(ok);
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
    <div className="grid max-w-[700px] grid-cols-1fr/auto">
      <div className="">
        <div className="grid gap-y-7">
          <div className="grid gap-y-2">
            <Typography
              variant={TYPOGRAPHY.H7}
              className="font-normal text-grey-900"
            >
              Basic information
            </Typography>
            {isDirty && (
              <Typography
                variant={TYPOGRAPHY.R4}
                className="text-system-error-500"
              >
                Warning: You have unsaved changes
              </Typography>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-4">
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
              id="publisher"
              label="Publisher"
              value={teamName}
              readOnly
              tabIndex={-1}
              className="pointer-events-none"
            />
          </div>

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

          <FloatingInput
            id="app-id"
            label="ID"
            value={appId}
            readOnly
            tabIndex={-1}
            style={{ WebkitTextFillColor: "#9BA3AE", color: "#9BA3AE" }}
            addOnRight={<CopyButton fieldName="App ID" fieldValue={appId} />}
          />
        </div>
      </div>
    </div>
  );
});

BasicInformation.displayName = "BasicInformation";
