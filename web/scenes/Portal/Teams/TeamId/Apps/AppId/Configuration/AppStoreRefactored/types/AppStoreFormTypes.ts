import { FetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";

export type LocalisationData = Array<{
  locale: string;
  name?: string | null;
  short_name?: string | null;
  world_app_description?: string | null;
  description?: string | null;
  meta_tag_image_url?: string | null;
  showcase_img_urls?: string[] | null;
}>;

export type AppMetadata = FetchAppMetadataQuery["app"][0]["app_metadata"][0];

export type AppStoreFormProps = {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
  localisationsData: LocalisationData;
};

export type FormSectionProps = {
  isEditable: boolean;
  isEnoughPermissions: boolean;
};

export type SupportType = "email" | "link";
