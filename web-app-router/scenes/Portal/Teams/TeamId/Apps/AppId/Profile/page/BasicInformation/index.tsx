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
}) => {
  const { appId, teamId, app } = props;
  const [viewMode] = useAtom(viewModeAtom);
  const [status, setStatus] = useState(app.status === "active");
  const [updateAppInfoMutation, { loading }] = useUpdateAppInfoMutation({});
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId
    );
    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [teamId, user?.hasura.memberships]);

  const appMetaData =
    viewMode === "verified"
      ? app.verified_app_metadata[0]
      : app.app_metadata[0];

  const isEditable =
    appMetaData.verification_status === "unverified" ||
    app?.app_metadata.length === 0;

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

  useEffect(() => {
    reset({
      name: appMetaData.name,
      category: appMetaData.category,
    });
  }, [viewMode, appMetaData, reset]);

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
            app_metadata_id: app.app_metadata[0].id,
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
    [app?.app_metadata, appId, loading, status, teamId, updateAppInfoMutation]
  );

  return (
    <div className="grid grid-cols-2">
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
          {/* TODO: Graphql Sync */}
          <Input label="Publisher" required disabled placeholder="Team Name" />
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
