"use client";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { Input } from "@/components/Input";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
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
import { Controller, useForm } from "react-hook-form";
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
    control,
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
    [appMetaData?.id, appId, refetchAppMetadata],
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

          <Controller
            name="engine"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={field.onChange}
                disabled={!isEditable || !isEnoughPermissions}
                by={(a: string | null, b: string | null) => a === b}
              >
                <div className="inline-grid w-full font-gta transition-colors">
                  <fieldset
                    className={clsx(
                      "group grid w-full pb-2",
                      "rounded-lg border bg-grey-0",
                      {
                        "border-grey-200 focus-within:border-blue-500 hover:border-grey-700":
                          !errors.engine && isEditable && isEnoughPermissions,
                        "border-system-error-500":
                          !!errors.engine && isEditable && isEnoughPermissions,
                        "cursor-not-allowed border-grey-200 bg-grey-50 text-grey-400":
                          !isEditable || !isEnoughPermissions,
                      },
                    )}
                  >
                    <SelectButton
                      className={clsx(
                        "grid grid-cols-1fr/auto items-center py-1 text-left text-grey-700",
                        {
                          "cursor-not-allowed text-grey-400":
                            !isEditable || !isEnoughPermissions,
                        },
                      )}
                    >
                      <Typography variant={TYPOGRAPHY.R4}>
                        {field.value === EngineType.OnChain
                          ? "On-chain"
                          : "Cloud"}
                      </Typography>
                      <CaretIcon
                        className={clsx("text-grey-400 transition-colors", {
                          "group-hover:text-grey-700":
                            isEditable && isEnoughPermissions,
                        })}
                      />
                    </SelectButton>

                    <SelectOptions className="mt-3 text-sm focus:outline-none">
                      <SelectOption value={EngineType.Cloud}>
                        <Typography variant={TYPOGRAPHY.R5}>Cloud</Typography>
                      </SelectOption>
                      <SelectOption value={EngineType.OnChain}>
                        <Typography variant={TYPOGRAPHY.R5}>
                          On-chain
                        </Typography>
                      </SelectOption>
                    </SelectOptions>

                    <legend className="ml-4 whitespace-nowrap px-0.5 text-sm text-grey-500">
                      Engine <span className="text-system-error-500">*</span>
                    </legend>
                  </fieldset>

                  {errors.engine?.message && (
                    <Typography
                      className="mt-2 px-2 text-system-error-500"
                      variant={TYPOGRAPHY.R5}
                    >
                      {errors.engine.message}
                    </Typography>
                  )}
                  <Typography
                    variant={TYPOGRAPHY.R5}
                    className="mt-2 px-2 text-grey-500"
                  >
                    Choose where your World ID proofs will be verified.
                  </Typography>
                </div>
              </Select>
            )}
          />

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
