/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from "@apollo/client";
import { ApolloProvider, useQuery } from "@apollo/client/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createStore, Provider as JotaiProvider } from "jotai";
import { ReactNode } from "react";

// #region Mocks
const getImageMock = jest.fn();
const uploadViaPresignedPostMock = jest.fn();
const toastErrorMock = jest.fn();

jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

// lib/utils transitively imports IDKit/ox, which needs TextEncoder (absent in
// jsdom). Keep the one utility used by this component behaviorally faithful.
jest.mock("@/lib/utils", () => ({
  getCDNImageUrl: (appId: string, path: string) =>
    `https://cdn.test/${appId}/${path}`,
}));

// S3 and signed-image lookup are the I/O boundary. Crop selection and the
// ContentCardImageUpload flow itself remain real.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image",
  () => {
    const actual = jest.requireActual(
      "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image",
    );
    return {
      ...actual,
      useImage: () => ({
        getImage: getImageMock,
        uploadViaPresignedPost: uploadViaPresignedPostMock,
      }),
    };
  },
);
// #endregion

import { ContentCardImageUpload } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ContentCardImageUpload";
import {
  unverifiedImageAtom,
  viewModeAtom,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout/ImagesProvider";
import { UpdateContentCardImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/ContentCardImageUpload/graphql/client/update-content-card-image.generated";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";

// #region Test Data
const APP_ID = "app_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const APP_METADATA_ID = "app_metadata_a1b2c3d4e5f6a7b8";
const TEAM_ID = "team_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const FETCH_VARIABLES = { id: APP_ID };

const makeAppMetadata = (
  contentCardImageUrl: string,
): FetchAppMetadataQuery["app"][number]["app_metadata"][number] => ({
  __typename: "app_metadata",
  id: APP_METADATA_ID,
  app_id: APP_ID,
  name: "Example app",
  logo_img_url: "logo.png",
  hero_image_url: "hero.png",
  meta_tag_image_url: "meta.png",
  showcase_img_urls: [],
  description: "Description",
  world_app_description: "World App description",
  category: "social",
  is_developer_allow_listing: false,
  world_app_button_text: "Open",
  integration_url: "https://example.test",
  app_website_url: "https://example.test",
  source_code_url: "https://github.com/example/app",
  verified_at: null,
  review_message: "",
  verification_status: "unverified",
  app_mode: "mini-app",
  whitelisted_addresses: [],
  support_link: "https://example.test/support",
  supported_countries: [],
  supported_languages: ["en"],
  short_name: "Example",
  associated_domains: [],
  contracts: [],
  permit2_tokens: [],
  can_import_all_contacts: false,
  can_use_attestation: false,
  is_allowed_unlimited_notifications: false,
  max_notifications_per_day: 1,
  is_android_only: false,
  is_for_humans_only: false,
  content_card_image_url: contentCardImageUrl,
});

const makeFetchAppMetadata = (
  contentCardImageUrl: string,
): FetchAppMetadataQuery => ({
  __typename: "query_root",
  app: [
    {
      __typename: "app",
      id: APP_ID,
      engine: "minikit",
      is_staging: true,
      status: "active",
      team: { __typename: "team", name: "Example team" },
      app_metadata: [makeAppMetadata(contentCardImageUrl)],
      verified_app_metadata: [],
    },
  ],
});

const makeUnverifiedImages = (contentCardImageUrl: string) => ({
  logo_img_url: "logo.png",
  showcase_image_urls: [],
  meta_tag_image_url: "meta.png",
  content_card_image_url: contentCardImageUrl,
});

type ApolloHarnessOptions = {
  initialContentCardImageUrl?: string;
  rejectMutation?: boolean;
};

const createApolloHarness = (options: ApolloHarnessOptions = {}) => {
  const initialContentCardImageUrl =
    options.initialContentCardImageUrl ?? "existing.png";
  const operationNames: string[] = [];
  let completedMutations = 0;
  const cache = new InMemoryCache();

  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        const operationName = operation.operationName ?? "UnnamedOperation";
        operationNames.push(operationName);

        const timeoutId = setTimeout(() => {
          if (operationName === "FetchAppMetadata") {
            observer.next({
              data: makeFetchAppMetadata(initialContentCardImageUrl),
            });
            observer.complete();
            return;
          }

          if (operationName === "UpdateContentCardImage") {
            if (options.rejectMutation) {
              observer.error(new Error("metadata update failed"));
              return;
            }

            observer.next({
              data: {
                update_app_metadata_by_pk: {
                  __typename: "app_metadata",
                  id: APP_METADATA_ID,
                  content_card_image_url: operation.variables.fileName,
                },
              },
            });
            observer.complete();
            completedMutations += 1;
            return;
          }

          observer.error(new Error(`Unexpected operation: ${operationName}`));
        }, 0);

        return () => clearTimeout(timeoutId);
      }),
  );

  return {
    cache,
    client: new ApolloClient({ cache, link }),
    operationNames,
    completedMutations: () => completedMutations,
  };
};

const CachedContentCardImage = () => {
  const { data } = useQuery(FetchAppMetadataDocument, {
    variables: FETCH_VARIABLES,
  });

  return (
    <output data-testid="cached-content-card-image">
      {data?.app[0]?.app_metadata[0]?.content_card_image_url ?? "loading"}
    </output>
  );
};

const renderUploader = (options: ApolloHarnessOptions = {}) => {
  const apollo = createApolloHarness(options);
  const store = createStore();
  store.set(viewModeAtom, "unverified");
  store.set(
    unverifiedImageAtom,
    makeUnverifiedImages(options.initialContentCardImageUrl ?? ""),
  );

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={apollo.client}>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </ApolloProvider>
  );

  const rendered = render(
    <>
      <CachedContentCardImage />
      <ContentCardImageUpload
        appId={APP_ID}
        appMetadataId={APP_METADATA_ID}
        teamId={TEAM_ID}
        isEditable
        isError={false}
      />
    </>,
    { wrapper },
  );

  return { ...rendered, ...apollo, store };
};

const selectFile = (container: HTMLElement, file: File) =>
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [file] },
  });

const removeImage = () => {
  const image = screen.getByAltText("content card image");
  const imageContainer = image.closest("div.relative");
  const buttons = imageContainer?.querySelectorAll("button");
  if (!buttons?.[1]) throw new Error("Remove image button not found");
  fireEvent.click(buttons[1]);
};

const originalLocation = window.location;
const reloadMock = jest.fn();
// #endregion

beforeAll(() => {
  Object.defineProperty(Element.prototype, "getAnimations", {
    configurable: true,
    value: () => [],
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  getImageMock.mockReset();
  uploadViaPresignedPostMock.mockReset().mockResolvedValue(undefined);

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn(() => "blob:content-card-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(window, "Image", {
    configurable: true,
    value: class {
      naturalWidth = 345;
      naturalHeight = 240;
      onload?: () => void;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    },
  });
  Object.defineProperty(window, "location", {
    configurable: true,
    value: Object.assign(new URL("https://developer.test"), {
      reload: reloadMock,
    }),
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

// #region Apollo normalization
describe("Content Card Image Apollo normalization", () => {
  it("merges the mutation response into cached FetchAppMetadata", async () => {
    const { client, cache } = createApolloHarness();
    cache.writeQuery({
      query: FetchAppMetadataDocument,
      variables: FETCH_VARIABLES,
      data: makeFetchAppMetadata("old.png"),
    });

    await client.mutate({
      mutation: UpdateContentCardImageDocument,
      variables: {
        id: APP_METADATA_ID,
        fileName: "content_card_image.png",
      },
    });

    expect(
      cache.readQuery<FetchAppMetadataQuery>({
        query: FetchAppMetadataDocument,
        variables: FETCH_VARIABLES,
      })?.app[0]?.app_metadata[0]?.content_card_image_url,
    ).toBe("content_card_image.png");
    expect(Object.keys(cache.extract())).toContain(
      `app_metadata:${APP_METADATA_ID}`,
    );
  });
});
// #endregion

// #region Upload
describe("ContentCardImageUpload [upload]", () => {
  it("uses normalized mutation results for two uploads without refetching or reloading", async () => {
    getImageMock
      .mockResolvedValueOnce("https://signed.test/content-card-first.png")
      .mockResolvedValueOnce("https://signed.test/content-card-second.png");
    const { container, operationNames, completedMutations, store } =
      renderUploader();

    await waitFor(() =>
      expect(screen.getByTestId("cached-content-card-image")).toHaveTextContent(
        "existing.png",
      ),
    );
    operationNames.length = 0;

    selectFile(
      container,
      new File(["first"], "content-card.png", { type: "image/png" }),
    );
    await waitFor(() => expect(completedMutations()).toBe(1));
    expect(store.get(unverifiedImageAtom).content_card_image_url).toBe(
      "https://signed.test/content-card-first.png",
    );

    selectFile(
      container,
      new File(["second"], "content-card.png", { type: "image/png" }),
    );
    await waitFor(() => expect(completedMutations()).toBe(2));

    expect(operationNames).toEqual([
      "UpdateContentCardImage",
      "UpdateContentCardImage",
    ]);
    expect(operationNames).not.toContain("FetchAppMetadata");
    expect(reloadMock).not.toHaveBeenCalled();
    expect(store.get(unverifiedImageAtom).content_card_image_url).toBe(
      "https://signed.test/content-card-second.png",
    );
    expect(screen.getByTestId("cached-content-card-image")).toHaveTextContent(
      "content_card_image.png",
    );
  });
});
// #endregion

// #region Delete
describe("ContentCardImageUpload [delete]", () => {
  it("clears the local image and updates Apollo without refetching", async () => {
    const { operationNames, completedMutations, store } = renderUploader({
      initialContentCardImageUrl: "https://signed.test/existing.png",
    });

    await waitFor(() =>
      expect(screen.getByTestId("cached-content-card-image")).toHaveTextContent(
        "https://signed.test/existing.png",
      ),
    );
    operationNames.length = 0;

    removeImage();
    expect(store.get(unverifiedImageAtom).content_card_image_url).toBe("");
    await waitFor(() => expect(completedMutations()).toBe(1));

    expect(operationNames).toEqual(["UpdateContentCardImage"]);
    expect(operationNames).not.toContain("FetchAppMetadata");
    expect(screen.getByTestId("cached-content-card-image")).toHaveTextContent(
      /^$/,
    );
  });

  it("restores the local image when the delete mutation fails", async () => {
    const previousImage = "https://signed.test/existing.png";
    const { operationNames, store } = renderUploader({
      initialContentCardImageUrl: previousImage,
      rejectMutation: true,
    });

    await waitFor(() =>
      expect(screen.getByTestId("cached-content-card-image")).toHaveTextContent(
        previousImage,
      ),
    );
    operationNames.length = 0;

    removeImage();
    expect(store.get(unverifiedImageAtom).content_card_image_url).toBe("");

    await waitFor(() =>
      expect(store.get(unverifiedImageAtom).content_card_image_url).toBe(
        previousImage,
      ),
    );
    expect(toastErrorMock).toHaveBeenCalledWith("Failed to remove image");
    expect(operationNames).toEqual(["UpdateContentCardImage"]);
  });
});
// #endregion
