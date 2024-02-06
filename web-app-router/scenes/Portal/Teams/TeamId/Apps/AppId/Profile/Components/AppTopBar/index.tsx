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
import { useSubmitAppMutation } from "./graphql/client/submit-app.generated";
import { toast } from "react-toastify";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

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
      "Integration URL is not a valid url"
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
  const [submitAppMutation, { loading }] = useSubmitAppMutation({});

  const appMetaData =
    viewMode === "verified"
      ? app.verified_app_metadata[0]
      : app.app_metadata[0];

  const submitForReview = async () => {
    const dataToSubmit = app.app_metadata[0];
    try {
      await submitSchema.validate(dataToSubmit, { abortEarly: false });
      await submitAppMutation({
        variables: {
          app_metadata_id: appId,
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
      <DecoratedButton
        type="submit"
        className="px-6 py-3 h-12"
        onClick={submitForReview}
        disabled={loading}
      >
        <Typography variant={TYPOGRAPHY.M3}>Submit for review</Typography>
      </DecoratedButton>
    </div>
  );
};
