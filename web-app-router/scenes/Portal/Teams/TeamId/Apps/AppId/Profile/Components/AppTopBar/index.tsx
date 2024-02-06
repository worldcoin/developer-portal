import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Status, StatusVariant } from "./Status";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Environment } from "./Environment";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "../../graphql/client/fetch-app-metadata.generated";
import { useAtom } from "jotai";
import { viewModeAtom } from "../../layout";
import { LogoImageUpload } from "./LogoImageUpload";
import { useUpdateAppVerificationStatusMutation } from "./graphql/client/submit-app.generated";
import { toast } from "react-toastify";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { useCallback, useMemo } from "react";
import { Role_Enum } from "@/graphql/graphql";
import { useCreateEditableRowMutation } from "./graphql/client/create-editable-row.generated";

type AppTopBarProps = {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
};

const submitSchema = yup.object().shape({
  name: yup
    .string()
    .required("App name is required")
    .max(50, "App name cannot exceed 50 characters"),
  description_overview: yup
    .string()
    .max(1500, "Overview cannot exceed 1500 characters")
    .required("Description - Overview is required"),
  description_how_it_works: yup
    .string()
    .max(1500, "How it works cannot exceed 1500 characters")
    .required("Description - How it works is required"),
  description_connect: yup
    .string()
    .max(1500, "How to connect cannot exceed 1500 characters")
    .required("Description - How to connect is required"),
  world_app_description: yup
    .string()
    .max(50, "World app description cannot exceed 50 characters")
    .required("World app description is required"),
  logo_img_url: yup.string().required("A logo image is required"),
  hero_image_url: yup.string().required("A featured image is required"),
  showcase_img_urls: yup
    .array()
    .of(yup.string().required("At least one showcase image is required"))
    .min(1, "At least one showcase image is required")
    .required("At least one showcase image is required"),
  integration_url: yup
    .string()
    .url("Integration URL is not a valid url")
    .matches(
      /^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/,
      "Integration URL is not a valid url",
    )
    .required("Integration URL is required"),
  app_website_url: yup
    .string()
    .url("App Website URL is not a valid url")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "App Website URL is not a valid url",
      excludeEmptyString: true,
    })
    .optional(),
  source_code_url: yup
    .string()
    .url("Source Code URL is not a valid url")
    .matches(/^https:\/\/(\w+-)*\w+(\.\w+)+([\/\w\-._/?%&#=]*)?$/, {
      message: "Source Code URL is not a valid url",
      excludeEmptyString: true,
    })
    .optional(),
  category: yup.string().required("Category is required"),
  is_developer_allow_listing: yup.boolean(),
});

export const AppTopBar = (props: AppTopBarProps) => {
  const { appId, teamId, app } = props;
  const [viewMode, setviewMode] = useAtom(viewModeAtom);
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    const membership = user?.hasura.memberships.find(
      (m) => m.team?.id === teamId,
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
    app?.app_metadata[0]?.verification_status === "unverified" ||
    app?.app_metadata.length === 0;

  const [updateAppVerificationStatusMutation, { loading }] =
    useUpdateAppVerificationStatusMutation({});

  const [createEditableRowMutation, { loading: creatingRow }] =
    useCreateEditableRowMutation({});

  const submitForReview = async () => {
    if (loading) return;
    const dataToSubmit = app.app_metadata[0];
    try {
      await submitSchema.validate(dataToSubmit, { abortEarly: false });
      await updateAppVerificationStatusMutation({
        variables: {
          app_metadata_id: dataToSubmit.id,
          verification_status: "awaiting_review",
        },
        context: { headers: { team_id: teamId } },
        refetchQueries: [
          {
            query: FetchAppMetadataDocument,
            variables: {
              id: appId,
            },
            context: { headers: { team_id: teamId } },
          },
        ],
        awaitRefetchQueries: true,
      });
      toast.success("App submitted for review");
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        toast.error(error.errors[0]);
        return;
      } else {
        console.error(error);
        toast.error("Error occurred while submitting app for review");
      }
    }
  };

  const removeFromReview = useCallback(async () => {
    if (loading) return;
    const appMetadataId = app.app_metadata[0].id;
    await updateAppVerificationStatusMutation({
      variables: {
        app_metadata_id: appMetadataId,
        verification_status: "unverified",
      },
      context: { headers: { team_id: teamId } },
      refetchQueries: [
        {
          query: FetchAppMetadataDocument,
          variables: {
            id: appId,
          },
          context: { headers: { team_id: teamId } },
        },
      ],
      awaitRefetchQueries: true,
    });
  }, [teamId, appId, updateAppVerificationStatusMutation]);

  const createNewDraft = useCallback(async () => {
    try {
      if (!app || app?.app_metadata?.[0].verification_status !== "verified") {
        throw new Error("Your app must be already verified for this action");
      }
      await createEditableRowMutation({
        variables: {
          app_id: appId,
          name: appMetaData.name,
          description: appMetaData.description,
          world_app_description: appMetaData.world_app_description,
          category: appMetaData.category,
          is_developer_allow_listing: appMetaData.is_developer_allow_listing,
          app_website_url: appMetaData.app_website_url,
          source_code_url: appMetaData.source_code_url,
          integration_url: appMetaData.integration_url,
          logo_img_url: `logo_img.${_getImageEndpoint(
            appMetaData.logo_img_url,
          )}`,
          hero_image_url: `hero_image.${_getImageEndpoint(
            appMetaData.hero_image_url,
          )}`,
          showcase_img_urls: appMetaData.showcase_img_urls?.map(
            (img: string, index: number) =>
              `showcase_img_${index + 1}.${_getImageEndpoint(img)}`,
          ),
          verification_status: "unverified",
        },
        context: { headers: { team_id: teamId } },
        refetchQueries: [
          {
            query: FetchAppMetadataDocument,
            variables: {
              id: appId,
            },
            context: { headers: { team_id: teamId } },
          },
        ],
        awaitRefetchQueries: true,
      });
      toast.success("New app draft created");
    } catch (error: any) {
      console.error(error.message);
      toast.error("Error creating a new draft");
    }
  }, [appMetaData, createEditableRowMutation]);

  // Helper function to ensure uploaded images are png or jpg. Otherwise hasura trigger will fail
  const _getImageEndpoint = (imageType: string) => {
    const fileType = imageType.split(".").pop();
    if (fileType === "png" || fileType === "jpg") {
      return fileType;
    } else {
      throw new Error("Unsupported image file type");
    }
  };

  return (
    <div className="grid grid-cols-auto/1fr/auto gap-x-8 items-center">
      {/* Placeholder */}
      <LogoImageUpload
        appId={appId}
        teamId={teamId}
        appMetadataId={appMetaData.id}
      />
      <div className="grid grid-cols-1 gap-y-1">
        <div className="flex flex-row gap-x-3 items-center">
          <Typography variant={TYPOGRAPHY.H6}>{appMetaData.name}</Typography>
          <Status status={appMetaData.verification_status as StatusVariant} />
        </div>
        <Environment
          environment={app.is_staging ? "staging" : "production"}
          engine={app.engine}
        />
      </div>
      {isEnoughPermissions && (
        <div>
          {isEditable ? (
            <DecoratedButton
              type="submit"
              className="px-6 py-3 h-12"
              onClick={submitForReview}
            >
              <Typography variant={TYPOGRAPHY.M3}>Submit for review</Typography>
            </DecoratedButton>
          ) : app?.app_metadata?.[0].verification_status === "verified" ? (
            <DecoratedButton
              type="submit"
              className="px-6 py-3 h-12"
              onClick={createNewDraft}
            >
              <Typography variant={TYPOGRAPHY.M3}>Create new draft</Typography>
            </DecoratedButton>
          ) : (
            <DecoratedButton
              type="submit"
              className="px-6 py-3 h-12"
              onClick={removeFromReview}
            >
              <Typography variant={TYPOGRAPHY.M3}>
                Remove from review
              </Typography>
            </DecoratedButton>
          )}
        </div>
      )}
    </div>
  );
};
