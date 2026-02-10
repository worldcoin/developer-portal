"use client";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser, EngineType } from "@/lib/types";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
  FetchAppMetadataQueryVariables,
} from "../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../layout/ImagesProvider";
import { RemainingCharacters } from "../PageComponents/RemainingCharacters";
import { BasicInformationFormValues, schema } from "./form-schema";
import { QrQuickAction } from "./QrQuickAction";
import { validateAndSubmitServerSide } from "./server/submit";

export const BasicInformation = (props: {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
  teamName: string;
}) => {
  const { appId, teamId, app } = props;
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
      engine: app.engine as EngineType,
    };
  }, [appMetaData, app.engine]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<BasicInformationFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      ...editableAppMetadata,
    },
  });

  // Used to update the fields when view mode is change
  useEffect(() => {
    reset({
      ...editableAppMetadata,
    });
  }, [reset, editableAppMetadata]);

  const submit = useCallback(
    async (data: BasicInformationFormValues) => {
      const result = await validateAndSubmitServerSide(
        appMetaData?.id,
        appId,
        data,
      );
      if (!result.success) {
        toast.error(result.message);
      } else {
        await refetchAppMetadata();
        toast.success("App information updated successfully");
      }
    },
    [appMetaData?.id, refetchAppMetadata],
  );

  // Show QR quick action if the app has an integration URL
  // New mini apps may have an empty integration URL
  const showQrQuickAction = Boolean(appMetaData?.integration_url);

  const { url, showDraftMiniAppFlag } = useMemo(() => {
    let url = `https://world.org/mini-app?app_id=${appId}&path=`;
    let showDraftMiniAppFlag = appMetaData?.verification_status !== "verified";
    if (showDraftMiniAppFlag) {
      url += `&draft_id=${appMetaData?.id}`;
    }
    return { url, showDraftMiniAppFlag };
  }, [appId, appMetaData]);

  return (
    <div className="grid max-w-[580px] grid-cols-1fr/auto">
      <div className="">
        <form className="grid gap-y-7" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-y-2">
            <Typography variant={TYPOGRAPHY.H7} className="text-gray-900">
              Basic
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

          <Input
            register={register("name")}
            errors={errors.name}
            label="App name"
            disabled={!isEditable || !isEnoughPermissions}
            required
            placeholder="Enter your App Name"
            maxLength={50}
            addOnRight={
              <RemainingCharacters text={watch("name")} maxChars={50} />
            }
          />

          <Input
            label="App URL"
            required
            errors={errors.integration_url}
            disabled={!isEditable || !isEnoughPermissions}
            placeholder="https://"
            register={register("integration_url")}
          />

          <div className="inline-grid w-full font-gta transition-colors">
            <label htmlFor="engine" className="mb-2 text-sm text-grey-500">
              Engine <span className="text-system-error-500">*</span>
            </label>
            <select
              id="engine"
              {...register("engine")}
              disabled={!isEditable || !isEnoughPermissions}
              className={clsx(
                "h-12 rounded-lg border border-grey-200 bg-grey-0 px-3 text-sm text-grey-700",
                "focus:border-blue-500 focus:outline-none",
                {
                  "cursor-not-allowed border-grey-200 bg-grey-50 text-grey-400":
                    !isEditable || !isEnoughPermissions,
                },
              )}
            >
              <option value={EngineType.Cloud}>Cloud</option>
              <option value={EngineType.OnChain}>On-chain</option>
            </select>
            {errors.engine?.message && (
              <Typography
                className="mt-2 text-system-error-500"
                variant={TYPOGRAPHY.R5}
              >
                {errors.engine.message}
              </Typography>
            )}
            <Typography variant={TYPOGRAPHY.R5} className="mt-2 text-grey-500">
              Choose where your app verifications are processed.
            </Typography>
          </div>

          <Input
            label="ID"
            disabled
            placeholder={appId}
            addOnRight={<CopyButton fieldName="App ID" fieldValue={appId} />}
          />

          <DecoratedButton
            type="submit"
            variant="primary"
            className=" mr-5 h-12 w-40"
            disabled={!isEditable || !isEnoughPermissions || !isValid}
          >
            <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
          </DecoratedButton>
        </form>
        <div className="mt-7 flex justify-center sm:justify-start">
          {showQrQuickAction && (
            <QrQuickAction
              url={url}
              showDraftMiniAppFlag={showDraftMiniAppFlag}
            />
          )}
        </div>
      </div>
    </div>
  );
};
