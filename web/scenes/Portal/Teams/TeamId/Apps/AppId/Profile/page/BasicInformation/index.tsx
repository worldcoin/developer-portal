"use client";
import { CategorySelector } from "@/components/Category";
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
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { RemainingCharacters } from "../../PageComponents/RemainingCharacters";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../layout/ImagesProvider";
import { AppStatus } from "./AppStatus";
import { useUpdateAppInfoMutation } from "./graphql/client/update-app.generated";

const schema = yup.object({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  category: yup.string().optional(),
  status: yup.boolean().optional(),
});

export type BasicInformationFormValues = yup.Asserts<typeof schema>;

export const BasicInformation = (props: {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
  teamName: string;
}) => {
  const { appId, teamId, app, teamName } = props;
  const [viewMode] = useAtom(viewModeAtom);
  const [updateAppInfoMutation, { loading }] = useUpdateAppInfoMutation({});
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

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<BasicInformationFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: appMetaData?.name,
      category: appMetaData?.category,
      status: app.status === "active",
    },
  });

  // Used to update the fields when view mode is change
  useEffect(() => {
    reset({
      name: appMetaData?.name,
      category: appMetaData?.category,
      status: app.status === "active",
    });
  }, [viewMode, appMetaData?.name, appMetaData?.category, app?.status, reset]);

  const submit = useCallback(
    async (data: BasicInformationFormValues) => {
      if (loading) return;
      try {
        const { status, ...formData } = data;
        const result = await updateAppInfoMutation({
          variables: {
            app_id: appId,
            app_metadata_id: appMetaData?.id,
            input: formData,
            status: status ? "active" : "inactive",
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
            <Typography variant={TYPOGRAPHY.H7}>Basic Information</Typography>
            {isDirty && (
              <Typography
                variant={TYPOGRAPHY.R4}
                className="text-system-error-500"
              >
                Warning: You have unsaved changes
              </Typography>
            )}
          </div>
          <Controller
            name="status"
            control={control}
            render={({ field }) => {
              return (
                <AppStatus
                  status={field.value ?? false}
                  setStatus={field.onChange}
                  disabled={!isEditable || !isEnoughPermissions}
                />
              );
            }}
          />
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
          <Controller
            name="category"
            control={control}
            render={({ field }) => {
              return (
                <CategorySelector
                  value={field.value}
                  required
                  disabled={!isEditable || !isEnoughPermissions}
                  onChange={field.onChange}
                  errors={errors.category}
                  label="Category"
                />
              );
            }}
          />
          <Input
            label="ID"
            disabled
            placeholder={appId}
            addOnRight={<CopyButton fieldName="App ID" fieldValue={appId} />}
          />
          <Input label="Publisher" disabled placeholder={teamName} />
          <DecoratedButton
            type="submit"
            variant="primary"
            className=" mr-5 h-12 w-40"
            disabled={
              !isEditable || !isEnoughPermissions || !isDirty || !isValid
            }
          >
            <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
          </DecoratedButton>
        </form>
      </div>
    </div>
  );
};
