import { InMemoryCache } from "@apollo/client/cache";
import {
  FetchLocalisationsDocument,
  FetchLocalisationsQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import { updateLocalisationImageCache } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/update-localisation-image-cache";

const APP_METADATA_ID = "app_metadata_123";
const VARIABLES = { app_metadata_id: APP_METADATA_ID };

const makeLocalisation = (
  locale: string,
): FetchLocalisationsQuery["localisations"][number] => ({
  __typename: "localisations",
  locale,
  name: `${locale} name`,
  description: `${locale} description`,
  world_app_button_text: `${locale} button`,
  world_app_description: `${locale} world description`,
  short_name: `${locale} short name`,
  hero_image_url: `${locale}-hero.png`,
  meta_tag_image_url: `${locale}-meta.png`,
  showcase_img_urls: [`${locale}-showcase.png`],
});

const readLocalisations = (cache: InMemoryCache) =>
  cache.readQuery<FetchLocalisationsQuery>({
    query: FetchLocalisationsDocument,
    variables: VARIABLES,
  });

describe("updateLocalisationImageCache", () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache();
    cache.writeQuery<FetchLocalisationsQuery>({
      query: FetchLocalisationsDocument,
      variables: VARIABLES,
      data: {
        __typename: "query_root",
        localisations: [makeLocalisation("fr"), makeLocalisation("es")],
      },
    });
  });

  it("updates only the matching locale's showcase images", () => {
    updateLocalisationImageCache(cache, APP_METADATA_ID, "fr", {
      showcase_img_urls: ["showcase_img_1.png", "showcase_img_2.png"],
    });

    expect(readLocalisations(cache)?.localisations).toEqual([
      {
        ...makeLocalisation("fr"),
        showcase_img_urls: ["showcase_img_1.png", "showcase_img_2.png"],
      },
      makeLocalisation("es"),
    ]);
  });

  it("updates only the matching locale's meta tag image", () => {
    updateLocalisationImageCache(cache, APP_METADATA_ID, "fr", {
      meta_tag_image_url: "meta_tag_image.png",
    });

    expect(readLocalisations(cache)?.localisations).toEqual([
      {
        ...makeLocalisation("fr"),
        meta_tag_image_url: "meta_tag_image.png",
      },
      makeLocalisation("es"),
    ]);
  });

  it("adds a complete localization row when the locale is not cached", () => {
    updateLocalisationImageCache(cache, APP_METADATA_ID, "de", {
      showcase_img_urls: ["showcase_img_1.png"],
    });

    expect(readLocalisations(cache)?.localisations[2]).toEqual({
      __typename: "localisations",
      locale: "de",
      name: "",
      description: "",
      world_app_button_text: "",
      world_app_description: "",
      short_name: "",
      hero_image_url: "",
      meta_tag_image_url: "",
      showcase_img_urls: ["showcase_img_1.png"],
    });
  });

  it("does not create a partial query result when the query is not cached", () => {
    const emptyCache = new InMemoryCache();

    updateLocalisationImageCache(emptyCache, APP_METADATA_ID, "fr", {
      meta_tag_image_url: "meta_tag_image.png",
    });

    expect(readLocalisations(emptyCache)).toBeNull();
  });
});
