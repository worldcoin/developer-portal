import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { TextArea } from "@/components/TextArea";
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
import { RemainingCharacters } from "../../../PageComponents/RemainingCharacters";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../../layout/ImagesProvider";
import { DescriptionSubFields } from "../../../types";
import { useUpdateAppStoreInfoMutation } from "../graphql/client/update-store-info.generated";

function noLinks(value: string | undefined) {
  if (!value) return true;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return !urlRegex.test(value);
}

const schema = yup.object().shape({
  world_app_description: yup
    .string()
    .max(35, "World app description cannot exceed 35 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .optional(),
  description_overview: yup
    .string()
    .max(1500, "Overview cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .required("This section is required"),
  description_how_it_works: yup
    .string()
    .max(1500, "How it works cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
    .optional(),
  description_connect: yup
    .string()
    .max(1500, "How to connect cannot exceed 1500 characters")
    .test("no-links", "Links not allowed here", noLinks)
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
    return checkUserPermissions(user, teamId, [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [teamId, user]);

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

          refetchQueries: [
            {
              query: FetchAppMetadataDocument,
              variables: { id: appId },
            },
          ],
        });
        if (result instanceof Error) {
          throw result;
        }
        toast.success("App information updated successfully");
      } catch (e) {
        console.error("Failed to update store info: ", e);
        toast.error("Failed to update app information");
      }
    },
    [updatingInfo, updateAppInfoMutation, appMetadata?.id, appId],
  );

  return (
    <div className="grid grid-cols-1fr/auto">
      <form className="grid gap-y-7" onSubmit={handleSubmit(submit)}>
        <div className="grid gap-y-3">
          <div className="grid gap-y-2">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
              App description
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
          <div className="grid gap-y-1">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Describe your app to potential users
            </Typography>
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
              <span className="text-sm text-system-error-500">*</span> Indicates
              the field is required to submit for review
            </Typography>
          </div>
        </div>

        <div className="grid gap-y-7">
          <TextArea
            label="Overview"
            required
            rows={5}
            maxLength={1500}
            errors={errors.description_overview}
            disabled={!isEditable || !isEnoughPermissions}
            addOn={
              <RemainingCharacters
                text={watch("description_overview")}
                maxChars={1500}
              />
            }
            placeholder="Give an overview of your app to potential users. What does it do? Why should they use it?"
            register={register("description_overview")}
          />
          <TextArea
            label={
              <>
                <span>How it works</span>{" "}
                <span style={{ color: "red" }}>*</span>
              </>
            }
            rows={5}
            maxLength={1500}
            errors={errors.description_how_it_works}
            disabled={!isEditable || !isEnoughPermissions}
            addOn={
              <RemainingCharacters
                text={watch("description_how_it_works")}
                maxChars={1500}
              />
            }
            placeholder="How do users interact with World ID in your app?"
            register={register("description_how_it_works")}
          />
          <TextArea
            label={
              <>
                <span>How to connect</span>{" "}
                <span style={{ color: "red" }}>*</span>
              </>
            }
            rows={5}
            maxLength={1500}
            errors={errors.description_connect}
            disabled={!isEditable || !isEnoughPermissions}
            placeholder="Explain any setup users need to complete before using World ID with this app."
            register={register("description_connect")}
            addOn={
              <RemainingCharacters
                text={watch("description_connect")}
                maxChars={1500}
              />
            }
          />
          <Input
            label={
              <>
                <span>World App description</span>{" "}
                <span style={{ color: "red" }}>*</span>
              </>
            }
            maxLength={35}
            errors={errors.world_app_description}
            disabled={!isEditable || !isEnoughPermissions}
            placeholder="This description will be shown inside of World App."
            register={register("world_app_description")}
            addOnRight={
              <RemainingCharacters
                text={watch("world_app_description")}
                maxChars={35}
              />
            }
          />
        </div>
        <DecoratedButton
          type="submit"
          className="h-12 w-40"
          disabled={!isEditable || !isEnoughPermissions || !isDirty || !isValid}
        >
          <Typography variant={TYPOGRAPHY.M3}>Save Changes</Typography>
        </DecoratedButton>
      </form>
    </div>
  );
};
