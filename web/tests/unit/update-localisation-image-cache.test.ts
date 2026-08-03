import { gql } from "@apollo/client";
import { InMemoryCache } from "@apollo/client/cache";
import {
  FetchLocalisationsDocument,
  FetchLocalisationsQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localisations.generated";
import {
  appendLocalisationToCache,
  synchronizeLocalisationsCache,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/utils/update-localisations-cache";

const APP_METADATA_ID = "app_metadata_123";
const VARIABLES = { app_metadata_id: APP_METADATA_ID };

const makeLocalisation = (
  locale: string,
): FetchLocalisationsQuery["localisations"][number] => ({
  __typename: "localisations",
  id: `localisation_${locale}`,
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

/**
 * Stands in for the merge Apollo performs when an upsert's `returning` row
 * arrives: scoped to the entity alone, touching neither the query nor its refs.
 */
const mergeImageFields = (
  cache: InMemoryCache,
  locale: string,
  data: Record<string, unknown>,
) =>
  cache.writeFragment({
    id: cache.identify({
      __typename: "localisations",
      id: `localisation_${locale}`,
    }),
    fragment: gql`
      fragment LocalisationImages on localisations {
        meta_tag_image_url
        showcase_img_urls
      }
    `,
    data,
  });

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

describe("localisations cache normalization", () => {
  it("merges an entity-scoped showcase update into only the matching locale", () => {
    mergeImageFields(cache, "fr", {
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

  it("merges an entity-scoped meta tag update into only the matching locale", () => {
    mergeImageFields(cache, "fr", {
      meta_tag_image_url: "meta_tag_image.png",
    });

    expect(readLocalisations(cache)?.localisations).toEqual([
      { ...makeLocalisation("fr"), meta_tag_image_url: "meta_tag_image.png" },
      makeLocalisation("es"),
    ]);
  });

  it("stores rows as normalized entities rather than inline under the query", () => {
    // Lose the id from the query and rows go back to being embedded, silently
    // reinstating manual patching.
    expect(Object.keys(cache.extract())).toContain(
      "localisations:localisation_fr",
    );
  });
});

describe("appendLocalisationToCache", () => {
  it("appends a newly inserted locale to the cached list", () => {
    const german = makeLocalisation("de");

    appendLocalisationToCache(cache, APP_METADATA_ID, german);

    expect(readLocalisations(cache)?.localisations).toEqual([
      makeLocalisation("fr"),
      makeLocalisation("es"),
      german,
    ]);
  });

  it("leaves the list untouched for a locale that is already a member", () => {
    // An upsert that updated an existing row lands here too, since the
    // response never says whether it inserted or updated. Its new field values
    // arrive through normalization instead.
    appendLocalisationToCache(cache, APP_METADATA_ID, {
      ...makeLocalisation("fr"),
      meta_tag_image_url: "meta_tag_image.png",
    });

    expect(readLocalisations(cache)?.localisations).toEqual([
      makeLocalisation("fr"),
      makeLocalisation("es"),
    ]);
  });

  it("does not create a partial query result when the query is not cached", () => {
    const emptyCache = new InMemoryCache();

    appendLocalisationToCache(
      emptyCache,
      APP_METADATA_ID,
      makeLocalisation("fr"),
    );

    expect(readLocalisations(emptyCache)).toBeNull();
  });
});

describe("synchronizeLocalisationsCache", () => {
  it("replaces stale rows with complete localizations from autosave", () => {
    const french = {
      ...makeLocalisation("fr"),
      name: "Application française",
      description: '{"overview":"Texte enregistré"}',
      showcase_img_urls: ["showcase_img_1.png"],
    };
    const german = {
      ...makeLocalisation("de"),
      name: "Deutsche Anwendung",
      meta_tag_image_url: "meta_tag_image.png",
    };

    synchronizeLocalisationsCache(cache, APP_METADATA_ID, [french, german]);

    expect(readLocalisations(cache)?.localisations).toEqual([french, german]);
  });

  it("preserves a legacy English row that autosave does not return", () => {
    const english = makeLocalisation("en");
    cache.writeQuery<FetchLocalisationsQuery>({
      query: FetchLocalisationsDocument,
      variables: VARIABLES,
      data: {
        __typename: "query_root",
        localisations: [english, makeLocalisation("fr")],
      },
    });

    synchronizeLocalisationsCache(cache, APP_METADATA_ID, [
      makeLocalisation("de"),
    ]);

    expect(readLocalisations(cache)?.localisations).toEqual([
      english,
      makeLocalisation("de"),
    ]);
  });
});
