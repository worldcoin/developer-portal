/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getDefaultStore, useAtomValue } from "jotai";
import { ReactNode } from "react";

// #region Mocks
const getImageMock = jest.fn();
const uploadViaPresignedPostMock = jest.fn();
const toastErrorMock = jest.fn();

jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

jest.mock("@/lib/utils", () => ({
  getCDNImageUrl: (appId: string, path: string) =>
    `https://cdn.test/${appId}/${path}`,
  tryParseJSON: (input: string) => JSON.parse(input),
}));

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
import { ImagesProvider } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout/ImagesProvider";

// #region Test Data
const APP_ID = "app_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const APP_METADATA_ID = "app_metadata_a1b2c3d4e5f6a7b8";
const TEAM_ID = "team_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const INITIAL_SIGNED_URL =
  "https://signed.test/content_card_image.png?version=old";
const REFRESHED_SIGNED_URL =
  "https://signed.test/content_card_image.png?version=new";
const originalLocation = window.location;
const reloadMock = jest.fn();

const ImageAtomPreview = () => {
  const images = useAtomValue(unverifiedImageAtom);
  return (
    <output data-testid="content-card-preview">
      {images.content_card_image_url}
    </output>
  );
};

const createApolloHarness = (options: { rejectUpdate?: boolean } = {}) => {
  const operationNames: string[] = [];
  let fetchImagesCalls = 0;
  const cache = new InMemoryCache();

  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        operationNames.push(operation.operationName ?? "UnnamedOperation");

        const timeoutId = setTimeout(() => {
          if (operation.operationName === "FetchImages") {
            fetchImagesCalls += 1;
            observer.next({
              data: {
                unverified_images: {
                  __typename: "ImageGetAllUnverifiedImagesOutput",
                  logo_img_url: "",
                  hero_image_url: "",
                  meta_tag_image_url: "",
                  showcase_img_urls: [],
                  content_card_image_url:
                    fetchImagesCalls === 1
                      ? INITIAL_SIGNED_URL
                      : REFRESHED_SIGNED_URL,
                },
              },
            });
            observer.complete();
            return;
          }

          if (operation.operationName === "UpdateContentCardImage") {
            if (options.rejectUpdate) {
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
            return;
          }

          observer.error(
            new Error(`Unexpected operation: ${operation.operationName}`),
          );
        }, 0);

        return () => clearTimeout(timeoutId);
      }),
  );

  return {
    client: new ApolloClient({ cache, link }),
    cache,
    operationNames,
  };
};

const renderUploader = (options: { rejectUpdate?: boolean } = {}) => {
  const apollo = createApolloHarness(options);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={apollo.client}>{children}</ApolloProvider>
  );

  const rendered = render(
    <ImagesProvider appId={APP_ID} teamId={TEAM_ID}>
      <ImageAtomPreview />
      <ContentCardImageUpload
        appId={APP_ID}
        appMetadataId={APP_METADATA_ID}
        teamId={TEAM_ID}
        isEditable
        isError={false}
      />
    </ImagesProvider>,
    { wrapper },
  );

  return { ...rendered, ...apollo };
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getDefaultStore().set(viewModeAtom, "unverified");
  getImageMock.mockResolvedValue(REFRESHED_SIGNED_URL);
  uploadViaPresignedPostMock.mockResolvedValue(undefined);

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

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

// #region Content-card image lifecycle
describe("ContentCardImageUpload [signed URL refresh]", () => {
  it("persists the stable image key, then refreshes the shared signed-URL preview", async () => {
    const { cache, container, operationNames } = renderUploader();

    await waitFor(() =>
      expect(screen.getByTestId("content-card-preview")).toHaveTextContent(
        INITIAL_SIGNED_URL,
      ),
    );

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(["image"], "content-card.png", { type: "image/png" })],
      },
    });

    await waitFor(() =>
      expect(screen.getByTestId("content-card-preview")).toHaveTextContent(
        REFRESHED_SIGNED_URL,
      ),
    );

    expect(operationNames).toEqual([
      "FetchImages",
      "UpdateContentCardImage",
      "FetchImages",
    ]);
    expect(reloadMock).not.toHaveBeenCalled();
    expect(cache.extract()[`app_metadata:${APP_METADATA_ID}`]).toMatchObject({
      content_card_image_url: "content_card_image.png",
    });
  });

  it("surfaces a metadata save failure through the upload error callback", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { container, operationNames } = renderUploader({
      rejectUpdate: true,
    });

    await waitFor(() =>
      expect(screen.getByTestId("content-card-preview")).toHaveTextContent(
        INITIAL_SIGNED_URL,
      ),
    );

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(["image"], "content-card.png", { type: "image/png" })],
      },
    });

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Couldn't upload that image. Please try again.",
      ),
    );
    expect(consoleError).toHaveBeenCalledWith(
      "content card image upload failed",
      expect.objectContaining({
        appMetadataId: APP_METADATA_ID,
        error: expect.any(Error),
      }),
    );
    expect(operationNames).toEqual(["FetchImages", "UpdateContentCardImage"]);
  });
});
// #endregion
