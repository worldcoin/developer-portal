import type { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";

export type FullAppMetadata =
  FetchAppMetadataQuery["app"][0]["app_metadata"][0];
