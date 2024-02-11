"use client";
import { Button } from "@/components/Button";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { toast } from "react-toastify";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Controller, useForm } from "react-hook-form";
import { DecoratedButton } from "@/components/DecoratedButton";
import { AppStatus } from "./AppStatus";
import { CategorySelector } from "./Category";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../graphql/client/fetch-app-metadata.generated";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useUpdateAppInfoMutation } from "./graphql/client/update-app.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { Role_Enum } from "@/graphql/graphql";
import { useAtom } from "jotai";
import { viewModeAtom } from "../../layout";
import { checkUserPermissions } from "@/lib/utils";

const schema = yup.object({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  category: yup.string().optional(),
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
  const [status, setStatus] = useState(app.status === "active");
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

  const isEditable = appMetaData.verification_status === "unverified";

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<BasicInformationFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: appMetaData.name,
      category: appMetaData.category,
    },
  });

  // Used to update the fields when view mode is change
  useEffect(() => {
    reset({
      name: appMetaData.name,
      category: appMetaData.category,
    });
  }, [viewMode, appMetaData?.name, appMetaData?.category, reset]);

  const copyId = () => {
    navigator.clipboard.writeText(appId);
    toast.success("Copied to clipboard");
  };

  const submit = useCallback(
    async (data: BasicInformationFormValues) => {
      if (loading) return;
      try {
        const result = await updateAppInfoMutation({
          variables: {
            app_id: appId,
            app_metadata_id: appMetaData.id,
            input: { ...data },
            status: status ? "active" : "inactive",
          },
          context: { headers: { team_id: teamId } },
          refetchQueries: [
            {
              query: FetchAppMetadataDocument,
              variables: { id: appId },
              context: { headers: { team_id: teamId } },
            },
          ],
          awaitRefetchQueries: true,
        });
        if (result instanceof Error) {
          throw result;
        }
        toast.success("App information updated successfully");
      } catch (e) {
        console.error(e);
        toast.error("Failed to update app information");
      }
    },
    [appId, appMetaData.id, loading, status, teamId, updateAppInfoMutation],
  );

  return (
    <div className="grid grid-cols-1fr/auto max-w-[580px]">
      <div className="">
        <form className="grid gap-y-7" onSubmit={handleSubmit(submit)}>
          <Typography variant={TYPOGRAPHY.H7}>Basic Information</Typography>
          <AppStatus
            status={status}
            setStatus={setStatus}
            disabled={!isEditable || !isEnoughPermissions}
          />
          <Input
            register={register("name")}
            errors={errors.name}
            label="App name"
            disabled={!isEditable || !isEnoughPermissions}
            required
            placeholder="Enter your App Name"
          />
          <Controller
            name="category"
            control={control}
            render={({ field }) => {
              return (
                <CategorySelector
                  value={field.value}
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
            addOnRight={
              <Button
                type="button"
                onClick={copyId}
                className="text-grey-900 pr-2"
              >
                <CopyIcon />
              </Button>
            }
          />
          <Input label="Publisher" disabled placeholder={teamName} />
          <DecoratedButton
            type="submit"
            variant="primary"
            className=" mr-5 w-40 h-12"
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
