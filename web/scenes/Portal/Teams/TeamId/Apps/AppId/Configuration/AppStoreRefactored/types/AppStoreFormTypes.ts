import { Categories } from "@/lib/categories";
import { languageMap } from "@/lib/languages";
import { FetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { FetchLocalisationsQuery } from "../graphql/client/fetch-localisations.generated";

export type LocalisationData = Readonly<
  Array<
    Pick<
      FetchLocalisationsQuery["localisations"][0],
      | "locale"
      | "name"
      | "short_name"
      | "world_app_description"
      | "description"
      | "meta_tag_image_url"
      | "showcase_img_urls"
    > & {
      locale: keyof typeof languageMap;
    }
  >
>;

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
  > & {
    // stricter type overrides
    verification_status:
      | "unverified"
      | "verified"
      | "awaiting_review"
      | "changes_requested";
    app_mode: "external" | "mini-app" | "native";
    category: (typeof Categories)[number]["name"];
    supported_languages: (keyof typeof languageMap)[];
  }
>;

export type AppStoreFormProps = {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
};

export type FormSectionProps = {
  isEditable: boolean;
  isEnoughPermissions: boolean;
};

export type SupportType = "email" | "link";
