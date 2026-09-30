import { gql } from "@apollo/client";
import { InMemoryCache } from "@apollo/client/cache";
import {
  FetchLocalizationsDocument,
  FetchLocalizationsQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/fetch-localizations.generated";
import {
  appendLocalizationToCache,
  synchronizeLocalizationsCache,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/utils/update-localizations-cache";

const APP_METADATA_ID = "app_metadata_123";
const VARIABLES = { app_metadata_id: APP_METADATA_ID };

const makeLocalization = (
  locale: string,
): FetchLocalizationsQuery["localisations"][number] => ({
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

const readLocalizations = (cache: InMemoryCache) =>
  cache.readQuery<FetchLocalizationsQuery>({
    query: FetchLocalizationsDocument,
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
      fragment LocalizationImages on localisations {
        meta_tag_image_url
        showcase_img_urls
      }
    `,
    data,
  });

let cache: InMemoryCache;

beforeEach(() => {
  cache = new InMemoryCache();
  cache.writeQuery<FetchLocalizationsQuery>({
    query: FetchLocalizationsDocument,
    variables: VARIABLES,
    data: {
      __typename: "query_root",
      localisations: [makeLocalization("fr"), makeLocalization("es")],
    },
  });
});

describe("localizations cache normalization", () => {
  it("merges an entity-scoped showcase update into only the matching locale", () => {
    mergeImageFields(cache, "fr", {
      showcase_img_urls: ["showcase_img_1.png", "showcase_img_2.png"],
    });

    expect(readLocalizations(cache)?.localisations).toEqual([
      {
        ...makeLocalization("fr"),
        showcase_img_urls: ["showcase_img_1.png", "showcase_img_2.png"],
      },
      makeLocalization("es"),
    ]);
  });

  it("merges an entity-scoped meta tag update into only the matching locale", () => {
    mergeImageFields(cache, "fr", {
      meta_tag_image_url: "meta_tag_image.png",
    });

    expect(readLocalizations(cache)?.localisations).toEqual([
      { ...makeLocalization("fr"), meta_tag_image_url: "meta_tag_image.png" },
      makeLocalization("es"),
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

describe("appendLocalizationToCache", () => {
  it("appends a newly inserted locale to the cached list", () => {
    const german = makeLocalization("de");

    appendLocalizationToCache(cache, APP_METADATA_ID, german);

    expect(readLocalizations(cache)?.localisations).toEqual([
      makeLocalization("fr"),
      makeLocalization("es"),
      german,
    ]);
  });

  it("leaves the list untouched for a locale that is already a member", () => {
    // An upsert that updated an existing row lands here too, since the
    // response never says whether it inserted or updated. Its new field values
    // arrive through normalization instead.
    appendLocalizationToCache(cache, APP_METADATA_ID, {
      ...makeLocalization("fr"),
      meta_tag_image_url: "meta_tag_image.png",
    });

    expect(readLocalizations(cache)?.localisations).toEqual([
      makeLocalization("fr"),
      makeLocalization("es"),
    ]);
  });

  it("does not create a partial query result when the query is not cached", () => {
    const emptyCache = new InMemoryCache();

    appendLocalizationToCache(
      emptyCache,
      APP_METADATA_ID,
      makeLocalization("fr"),
    );

    expect(readLocalizations(emptyCache)).toBeNull();
  });
});

describe("synchronizeLocalizationsCache", () => {
  it("replaces stale rows with complete localizations from autosave", () => {
    const french = {
      ...makeLocalization("fr"),
      name: "Application française",
      description: '{"overview":"Texte enregistré"}',
      showcase_img_urls: ["showcase_img_1.png"],
    };
    const german = {
      ...makeLocalization("de"),
      name: "Deutsche Anwendung",
      meta_tag_image_url: "meta_tag_image.png",
    };

    synchronizeLocalizationsCache(cache, APP_METADATA_ID, [french, german]);

    expect(readLocalizations(cache)?.localisations).toEqual([french, german]);
  });

  it("preserves a legacy English row that autosave does not return", () => {
    const english = makeLocalization("en");
    cache.writeQuery<FetchLocalizationsQuery>({
      query: FetchLocalizationsDocument,
      variables: VARIABLES,
      data: {
        __typename: "query_root",
        localisations: [english, makeLocalization("fr")],
      },
    });

    synchronizeLocalizationsCache(cache, APP_METADATA_ID, [
      makeLocalization("de"),
    ]);

    expect(readLocalizations(cache)?.localisations).toEqual([
      english,
      makeLocalization("de"),
    ]);
  });
});
