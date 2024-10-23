"use client";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../layout/ImagesProvider";
import { RemainingCharacters } from "../PageComponents/RemainingCharacters";
import { useUpdateAppInfoMutation } from "./graphql/client/update-app.generated";
import { QrQuickAction } from "./QrQuickAction";

const schema = yup.object({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  integration_url: yup
    .string()
    .url("Must be a valid https:// URL")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Link must be a valid HTTPS URL",
      excludeEmptyString: true,
    })
    .required("This field is required"),
});

export type BasicInformationFormValues = yup.Asserts<typeof schema>;

export const BasicInformation = (props: {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
  teamName: string;
}) => {
  const { appId, teamId, app, teamName } = props;
  const [updateAppInfoMutation, { loading }] = useUpdateAppInfoMutation();

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
    };
  }, [appMetaData]);

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
      if (loading) return;
      try {
        let result;

        result = await updateAppInfoMutation({
          variables: {
            app_metadata_id: appMetaData?.id,
            input: {
              ...data,
            },
          },
          refetchQueries: [
            {
              query: FetchAppMetadataDocument,
              variables: { id: appId },
            },
          ],
          awaitRefetchQueries: true,
        });

        if (result instanceof Error) {
          throw result;
        }
        toast.success("App information updated successfully");
      } catch (e) {
        console.error("Basic Info Failed to Update: ", e);
        toast.error("Failed to update app information");
      }
    },
    [appId, appMetaData?.id, loading, updateAppInfoMutation],
  );

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
            label="Try it out"
            required
            errors={errors.integration_url}
            disabled={!isEditable || !isEnoughPermissions}
            placeholder="https://"
            register={register("integration_url")}
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
          <QrQuickAction app_id={appId} />
        </div>
      </div>
    </div>
  );
};
