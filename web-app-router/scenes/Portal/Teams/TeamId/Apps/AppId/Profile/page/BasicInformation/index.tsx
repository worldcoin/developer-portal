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
import { useCallback, useState } from "react";
import { useUpdateAppInfoMutation } from "./graphql/client/update-app.generated";

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
  const [status, setStatus] = useState(app.status === "active");
  const [updateAppInfoMutation, { loading }] = useUpdateAppInfoMutation({});

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BasicInformationFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: app.app_metadata[0].name,
      category: app.app_metadata[0].category,
    },
  });

  const copyId = () => {
    navigator.clipboard.writeText(appId);
    toast.success("Copied to clipboard");
  };

  const submit = useCallback(
    async (data: BasicInformationFormValues) => {
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
    [status],
  );

  return (
    <div className="grid grid-cols-2">
      <div className="">
        <form className="grid gap-y-7" onSubmit={handleSubmit(submit)}>
          <Typography variant={TYPOGRAPHY.H7}>Basic Information</Typography>
          <AppStatus status={status} setStatus={setStatus} />
          <Input
            register={register("name")}
            errors={errors.name}
            label="App name"
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
            disabled={isSubmitting}
          >
            <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
          </DecoratedButton>
        </form>
      </div>
    </div>
  );
};
