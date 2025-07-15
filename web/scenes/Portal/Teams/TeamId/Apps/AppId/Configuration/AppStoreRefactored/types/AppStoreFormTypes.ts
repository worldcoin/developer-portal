import { Categories } from "@/lib/categories";
import { languageMap } from "@/lib/languages";
import { FetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";

export type LocalisationData = Array<{
  locale: keyof typeof languageMap;
  name?: string | null;
  short_name?: string | null;
  world_app_description?: string | null;
  description?: string | null;
  meta_tag_image_url?: string | null;
  showcase_img_urls?: string[] | null;
}>;

export type AppMetadata = Readonly<
  Pick<
    FetchAppMetadataQuery["app"][0]["app_metadata"][0],
    | "id"
    | "app_id"
    | "name"
    | "logo_img_url"
    | "hero_image_url"
    | "meta_tag_image_url"
    | "showcase_img_urls"
    | "description"
    | "world_app_description"
    | "category"
    | "is_developer_allow_listing"
    | "world_app_button_text"
    | "integration_url"
    | "app_website_url"
    | "source_code_url"
    | "verified_at"
    | "review_message"
    | "verification_status"
    | "app_mode"
    | "whitelisted_addresses"
    | "support_link"
    | "supported_countries"
    | "supported_languages"
    | "short_name"
    | "associated_domains"
    | "contracts"
    | "permit2_tokens"
    | "can_import_all_contacts"
    | "is_allowed_unlimited_notifications"
    | "max_notifications_per_day"
    | "is_android_only"
    | "is_for_humans_only"
  >
> & {
  // stricter type overrides
  verification_status: "unverified" | "verified" | "awaiting_review";
  app_mode: "external" | "mini-app" | "native";
  category: (typeof Categories)[number]["name"];
  supported_languages: (keyof typeof languageMap)[];
};

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
