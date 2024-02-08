import { TextArea } from "@/components/TextArea";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import { DescriptionSubFields } from "../../../types";
import { useCallback, useEffect, useMemo } from "react";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useUpdateAppStoreInfoMutation } from "../graphql/client/update-store-info.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { Role_Enum } from "@/graphql/graphql";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Input } from "@/components/Input";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useAtom } from "jotai";
import { viewModeAtom } from "../../../layout";

const schema = yup.object().shape({
  world_app_description: yup
    .string()
    .max(50, "World app description cannot exceed 50 characters")
    .optional(),
  description_overview: yup
    .string()
    .max(1500, "Overview cannot exceed 1500 characters")
    .required("This section is required"),
  description_how_it_works: yup
    .string()
    .max(1500, "How it works cannot exceed 1500 characters")
    .optional(),
  description_connect: yup
    .string()
    .max(1500, "How to connect cannot exceed 1500 characters")
    .optional(),
});

export type StoreInfoFormValues = yup.Asserts<typeof schema>;

type UpdateStoreInfoFormProps = {
  appMetadata?: FetchAppMetadataQuery["app"][0]["app_metadata"][0];
  teamId: string;
  appId: string;
};

export const UpdateStoreInfoForm = (props: UpdateStoreInfoFormProps) => {
  const { appMetadata, teamId, appId } = props;
  const [viewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;

  const [updateAppInfoMutation, { loading: updatingInfo }] =
    useUpdateAppStoreInfoMutation({});

  const isEditable = appMetadata?.verification_status === "unverified";
  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId,
    );
    return (
      membership?.role === Role_Enum.Owner ||
      membership?.role === Role_Enum.Admin
    );
  }, [teamId, user?.hasura.memberships]);

  const parseDescription = (stringifiedDescription: string) => {
    if (stringifiedDescription) {
      try {
        return JSON.parse(stringifiedDescription);
      } catch (error) {
        console.error("Failed to parse description:", error);
        return {
          description_overview: stringifiedDescription,
          description_how_it_works: "",
          description_connect: "",
        };
      }
    }
    return {};
  };

  const encodeDescription = (
    description_overview: string,
    description_how_it_works: string = "",
    description_connect: string = "",
  ) => {
    return JSON.stringify({
      [DescriptionSubFields.DescriptionOverview]: description_overview,
      [DescriptionSubFields.DescriptionHowItWorks]: description_how_it_works,
      [DescriptionSubFields.DescriptionConnect]: description_connect,
    });
  };

  const description = useMemo(() => {
    return parseDescription(appMetadata?.description ?? "");
  }, [appMetadata?.description]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<StoreInfoFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    defaultValues: {
      ...description,
      is_developer_allow_listing: appMetadata?.is_developer_allow_listing,
      world_app_description: appMetadata?.world_app_description,
    },
  });
  // Used to update the fields when view mode is change
  useEffect(() => {
    reset({
      ...description,
      is_developer_allow_listing: appMetadata?.is_developer_allow_listing,
      world_app_description: appMetadata?.world_app_description,
    });
  }, [
    viewMode,
    appMetadata?.is_developer_allow_listing,
    appMetadata?.world_app_description,
    reset,
    description,
  ]);

  const worldAppDescription = watch("world_app_description");
  const remainingCharacters = 50 - (worldAppDescription?.length || 0);

  const submit = useCallback(
    async (data: StoreInfoFormValues) => {
      if (updatingInfo) return;
      try {
        const result = await updateAppInfoMutation({
          variables: {
            app_metadata_id: appMetadata?.id ?? "",
            description: encodeDescription(
              data.description_overview,
              data.description_how_it_works,
              data.description_connect,
            ),
            world_app_description: data.world_app_description ?? "",
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
    [updatingInfo, updateAppInfoMutation, appMetadata?.id, teamId, appId],
  );

  return (
    <form className="grid gap-y-7" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-y-3">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          App description
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          Describe your app integration to possible users
        </Typography>
      </div>
      <div className="grid gap-y-5">
        <TextArea
          label="Overview"
          required
          rows={5}
          errors={errors.description_overview}
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="Describe the project for the users who would like to try your integration"
          register={register("description_overview")}
        />
        <TextArea
          label="How it works"
          rows={5}
          errors={errors.description_how_it_works}
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="How do users interact with World ID in your app?"
          register={register("description_how_it_works")}
        />
        <TextArea
          label="How to connect"
          rows={5}
          errors={errors.description_connect}
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="Explain, if required, how users should set up this app to start using World ID."
          register={register("description_connect")}
        />
        <Input
          label="World App Description"
          maxLength={50}
          errors={errors.world_app_description}
          disabled={!isEditable || !isEnoughPermissions}
          placeholder="Short description for display in the app"
          register={register("world_app_description")}
          addOnRight={
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
              {remainingCharacters}
            </Typography>
          }
        />
      </div>
      <DecoratedButton
        type="submit"
        className="w-40 h-12"
        disabled={!isEditable || !isEnoughPermissions || !isDirty || !isValid}
      >
        <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
      </DecoratedButton>
    </form>
  );
};
