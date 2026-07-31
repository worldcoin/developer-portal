/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { MockLink, type MockedResponse } from "@apollo/client/testing";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React, { useState } from "react";

// #region Mocks
const toastMocks = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
  update: jest.fn(),
  dismiss: jest.fn(),
};
let mockAcceptedUpload: ((file: File) => Promise<boolean>) | undefined;

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));

jest.mock("react-toastify", () => ({
  toast: {
    info: (...args: unknown[]) => toastMocks.info(...args),
    success: (...args: unknown[]) => toastMocks.success(...args),
    error: (...args: unknown[]) => toastMocks.error(...args),
    update: (...args: unknown[]) => toastMocks.update(...args),
    dismiss: (...args: unknown[]) => toastMocks.dismiss(...args),
  },
}));

// lib/utils transitively imports IDKit/ox, which needs TextEncoder (absent in
// jsdom). Mock only what the rendered tree uses.
jest.mock("@/lib/utils", () => ({
  getCDNImageUrl: (_appId: string, path: string) => `https://cdn/${path}`,
  tryParseJSON: (input: string) => {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  },
}));

jest.mock("@/components/Button", () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock("@/components/Dialog", () => ({
  Dialog: () => null,
}));

jest.mock("@/components/DialogOverlay", () => ({
  DialogOverlay: () => null,
}));

jest.mock("@/components/Icons/CloseIcon", () => ({
  CloseIcon: () => null,
}));

jest.mock("@/components/Icons/TrashIcon", () => ({
  TrashIcon: () => null,
}));

jest.mock("@/components/ImageDropZone", () => ({
  ImageDropZone: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="image-drop-zone">{children}</div>
  ),
}));

jest.mock("@/components/Typography", () => ({
  TYPOGRAPHY: { B3: "B3" },
  Typography: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

// The selection → crop gate is under test in pv3-logo-cropper; here the
// captured `upload` drives the accepted file straight into the transaction.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image",
  () => ({
    useCroppedImageUpload: ({
      upload,
    }: {
      upload: (file: File) => Promise<boolean>;
    }) => {
      mockAcceptedUpload = upload;
      return {
        cropCandidate: undefined,
        clearCropCandidate: jest.fn(),
        handleFileSelected: jest.fn(),
      };
    },
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/ImageDisplay",
  () => ({
    ImageDisplay: ({ src }: { src: string }) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="image preview" />
    ),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/ImageCropDialog",
  () => ({
    ImageCropDialog: () => null,
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/ImageLoader",
  () => ({
    __esModule: true,
    default: () => <div>uploading</div>,
  }),
);
// #endregion

import { UpsertLocalisedMetaTagImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/upsert-localised-meta-tag-image.generated";
import { UpsertLocalisedShowcaseImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/graphql/client/upsert-localised-showcase-images.generated";
import { useUnverifiedImages } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppStore/hooks/use-localised-image-field";
import { FetchImagesDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated";
import { GetUploadedImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/graphql/client/get-uploaded-image.generated";
import { UploadImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/graphql/client/upload-image.generated";
import { MetaTagImageField } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/MetaTagImageField";
import { ShowcaseImagesField } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/ShowcaseImagesField";

// #region Test Data
const appId = "app_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const teamId = "team_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const appMetadataId = "meta_1";

const transportMocks = (signedUrl: string): MockedResponse[] => [
  {
    request: { query: UploadImageDocument, variables: () => true },
    result: {
      data: {
        upload_image: {
          __typename: "PresignedPostOutput",
          url: "https://s3.test/upload",
          stringifiedFields: JSON.stringify({ key: "some-key" }),
        },
      },
    },
  },
  {
    request: { query: GetUploadedImageDocument, variables: () => true },
    result: {
      data: {
        get_uploaded_image: {
          __typename: "GetUploadedImageOutput",
          url: signedUrl,
        },
      },
    },
  },
];

const showcaseMutationMock = (
  captured: unknown[],
  options: { error?: Error } = {},
): MockedResponse => ({
  request: {
    query: UpsertLocalisedShowcaseImagesDocument,
    variables: (vars: Record<string, unknown>) => {
      captured.push(vars);
      return true;
    },
  },
  ...(options.error
    ? { error: options.error }
    : {
        result: {
          data: {
            update_supported_languages: {
              __typename: "app_metadata",
              id: appMetadataId,
              supported_languages: ["en"],
            },
            update_app_metadata_by_pk: {
              __typename: "app_metadata",
              id: appMetadataId,
              showcase_img_urls: [],
            },
          },
        },
      }),
});

const metaTagMutationMock = (
  captured: unknown[],
  options: { error?: Error } = {},
): MockedResponse => ({
  request: {
    query: UpsertLocalisedMetaTagImageDocument,
    variables: (vars: Record<string, unknown>) => {
      captured.push(vars);
      return true;
    },
  },
  ...(options.error
    ? { error: options.error }
    : {
        result: {
          data: {
            update_supported_languages: {
              __typename: "app_metadata",
              id: appMetadataId,
              supported_languages: ["en"],
            },
            update_app_metadata_by_pk: {
              __typename: "app_metadata",
              id: appMetadataId,
              meta_tag_image_url: "",
            },
          },
        },
      }),
});

const imagesVariables = { id: appId, team_id: teamId };

const seedImagesCache = (
  client: ApolloClient,
  images: Partial<{
    meta_tag_image_url: string | null;
    showcase_img_urls: string[] | null;
  }>,
) => {
  client.writeQuery({
    query: FetchImagesDocument,
    variables: imagesVariables,
    data: {
      unverified_images: {
        __typename: "ImageGetAllUnverifiedImagesOutput",
        logo_img_url: null,
        hero_image_url: null,
        meta_tag_image_url: null,
        showcase_img_urls: null,
        content_card_image_url: null,
        ...images,
      },
    },
  });
};

const readImagesCache = (client: ApolloClient) =>
  client.readQuery({
    query: FetchImagesDocument,
    variables: imagesVariables,
  })?.unverified_images;

/**
 * Renders a field the way LocalisationsSection does: one useUnverifiedImages
 * subscription feeding the field, plus form state committed only through
 * onCommittedValueChange (the autosave-suppressed install).
 */
const ShowcaseHarness = (props: {
  initialValue?: string[];
  onCommitted: jest.Mock;
}) => {
  const { unverifiedImages, isImagesLoading } = useUnverifiedImages({
    appId,
    teamId,
    locale: "en",
  });
  const [value, setValue] = useState<string[]>(props.initialValue ?? []);

  return (
    <ShowcaseImagesField
      value={value}
      onCommittedValueChange={(urls) => {
        props.onCommitted(urls);
        setValue(urls);
      }}
      appId={appId}
      teamId={teamId}
      locale="en"
      isAppVerified={false}
      appMetadataId={appMetadataId}
      supportedLanguages={["en"]}
      unverifiedImages={unverifiedImages}
      isImagesLoading={isImagesLoading}
    />
  );
};

const MetaTagHarness = (props: {
  initialValue?: string | null;
  onCommitted: jest.Mock;
}) => {
  const { unverifiedImages, isImagesLoading } = useUnverifiedImages({
    appId,
    teamId,
    locale: "en",
  });
  const [value, setValue] = useState<string | null>(props.initialValue ?? null);

  return (
    <MetaTagImageField
      value={value}
      onCommittedValueChange={(url) => {
        props.onCommitted(url);
        setValue(url);
      }}
      appId={appId}
      teamId={teamId}
      locale="en"
      isAppVerified={false}
      appMetadataId={appMetadataId}
      supportedLanguages={["en"]}
      unverifiedImages={unverifiedImages}
      isImagesLoading={isImagesLoading}
    />
  );
};

/**
 * Seeds the FetchImages cache before mounting so useUnverifiedImages resolves
 * from cache — exactly one FetchImages fetch happened earlier in the real
 * page's lifetime, and any refetch here would find no mock and error.
 */
const renderWithClient = (
  mocks: MockedResponse[],
  seededImages: Parameters<typeof seedImagesCache>[1],
  ui: React.ReactElement,
) => {
  const client = new ApolloClient({
    link: new MockLink(mocks),
    cache: new InMemoryCache(),
  });
  seedImagesCache(client, seededImages);
  const view = render(<ApolloProvider client={client}>{ui}</ApolloProvider>);
  return { client, view };
};

type Deferred = { resolve: () => void; promise: Promise<void> };
const deferred = (): Deferred => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { resolve, promise };
};

const stubS3 = (gate: Deferred) => {
  global.fetch = jest.fn(
    () =>
      new Promise((resolve) => {
        gate.promise.then(() =>
          resolve({ ok: true, text: async () => "" } as Response),
        );
      }),
  ) as never;
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  mockAcceptedUpload = undefined;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn(() => "blob:mock-1"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: jest.fn(),
  });
});

// #region upload success
describe("image upload [success path]", () => {
  it("shows the blob immediately, persists the path, and swaps in the signed URL with no reload/refetch", async () => {
    const signedUrl =
      "https://assets.test/unverified/app/showcase_img_1.png?signature=fresh";
    const captured: unknown[] = [];
    const s3Gate = deferred();
    stubS3(s3Gate);
    const onCommitted = jest.fn();

    const { client } = renderWithClient(
      [...transportMocks(signedUrl), showcaseMutationMock(captured)],
      { showcase_img_urls: [] },
      <ShowcaseHarness onCommitted={onCommitted} />,
    );

    const file = new File(["image"], "showcase.png", { type: "image/png" });
    let uploadPromise!: Promise<boolean>;
    act(() => {
      uploadPromise = mockAcceptedUpload!(file);
    });

    // The blob preview is on screen before S3, the mutation, or the signed
    // URL have resolved.
    expect(
      screen.getByAltText("Showcase Images upload preview"),
    ).toHaveAttribute("src", "blob:mock-1");
    expect(onCommitted).not.toHaveBeenCalled();
    expect(captured).toHaveLength(0);

    s3Gate.resolve();
    await act(async () => {
      await uploadPromise;
    });

    // The dedicated mutation persisted the metadata path (not a signed URL).
    expect(captured).toEqual([
      expect.objectContaining({
        app_metadata_id: appMetadataId,
        showcase_img_urls: ["showcase_img_1.png"],
        is_localized: false,
      }),
    ]);
    // Form state received the committed path.
    expect(onCommitted).toHaveBeenCalledWith(["showcase_img_1.png"]);
    // The preview cache was updated locally — no refetch ran (any FetchImages
    // network request would have found no mock and errored).
    expect(readImagesCache(client)?.showcase_img_urls).toEqual([signedUrl]);
    // The blob was replaced by the signed URL and revoked.
    expect(await screen.findByAltText("image preview")).toHaveAttribute(
      "src",
      signedUrl,
    );
    expect(
      screen.queryByAltText("Showcase Images upload preview"),
    ).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
  });
});
// #endregion

// #region upload failure
describe("image upload [metadata mutation failure]", () => {
  it("rolls back the preview and form state when the dedicated mutation fails", async () => {
    const signedUrl =
      "https://assets.test/unverified/app/showcase_img_1.png?signature=fresh";
    const captured: unknown[] = [];
    const s3Gate = deferred();
    s3Gate.resolve();
    stubS3(s3Gate);
    const onCommitted = jest.fn();

    const { client } = renderWithClient(
      [
        ...transportMocks(signedUrl),
        showcaseMutationMock(captured, { error: new Error("boom") }),
      ],
      { showcase_img_urls: [] },
      <ShowcaseHarness onCommitted={onCommitted} />,
    );

    const file = new File(["image"], "showcase.png", { type: "image/png" });
    await act(async () => {
      await mockAcceptedUpload!(file);
    });

    // The mutation was attempted but nothing was committed.
    expect(captured).toHaveLength(1);
    expect(onCommitted).not.toHaveBeenCalled();
    expect(readImagesCache(client)?.showcase_img_urls).toEqual([]);
    // The optimistic preview is gone and its blob revoked.
    expect(
      screen.queryByAltText("Showcase Images upload preview"),
    ).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    // Existing error UX fired.
    expect(toastMocks.error).toHaveBeenCalledWith(
      "Failed to auto-save showcase images",
    );
  });
});
// #endregion

// #region deletion
describe("image deletion", () => {
  const seededUrl =
    "https://assets.test/unverified/app/showcase_img_1.png?signature=old";

  it("persists the new metadata value and updates the preview locally", async () => {
    const captured: unknown[] = [];
    const onCommitted = jest.fn();

    const { client } = renderWithClient(
      [showcaseMutationMock(captured)],
      { showcase_img_urls: [seededUrl] },
      <ShowcaseHarness
        initialValue={["showcase_img_1.png"]}
        onCommitted={onCommitted}
      />,
    );

    await waitFor(() =>
      expect(screen.getByAltText("image preview")).toHaveAttribute(
        "src",
        seededUrl,
      ),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Delete showcase_img_1.png" }),
    );

    await waitFor(() => {
      expect(captured).toEqual([
        expect.objectContaining({ showcase_img_urls: [] }),
      ]);
    });
    expect(onCommitted).toHaveBeenCalledWith([]);
    expect(readImagesCache(client)?.showcase_img_urls).toEqual([]);
    expect(screen.queryByAltText("image preview")).not.toBeInTheDocument();
  });

  it("rolls back the value and preview when the deletion mutation fails", async () => {
    const captured: unknown[] = [];
    const onCommitted = jest.fn();

    const { client } = renderWithClient(
      [showcaseMutationMock(captured, { error: new Error("boom") })],
      { showcase_img_urls: [seededUrl] },
      <ShowcaseHarness
        initialValue={["showcase_img_1.png"]}
        onCommitted={onCommitted}
      />,
    );

    await waitFor(() =>
      expect(screen.getByAltText("image preview")).toBeInTheDocument(),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Delete showcase_img_1.png" }),
    );

    // Optimistic removal, then restore once the mutation fails.
    await waitFor(() => {
      expect(onCommitted).toHaveBeenNthCalledWith(1, []);
      expect(onCommitted).toHaveBeenNthCalledWith(2, ["showcase_img_1.png"]);
    });
    expect(readImagesCache(client)?.showcase_img_urls).toEqual([seededUrl]);
    expect(await screen.findByAltText("image preview")).toHaveAttribute(
      "src",
      seededUrl,
    );
  });
});
// #endregion

// #region same-key replacement
describe("replacing an image at the same draft S3 key", () => {
  it("renders the fresh signed URL after delete → re-upload of the fixed meta tag key", async () => {
    const oldUrl =
      "https://assets.test/unverified/app/meta_tag_image.png?signature=old";
    const newUrl =
      "https://assets.test/unverified/app/meta_tag_image.png?signature=new";
    const captured: unknown[] = [];
    const s3Gate = deferred();
    s3Gate.resolve();
    stubS3(s3Gate);
    const onCommitted = jest.fn();

    const { client } = renderWithClient(
      [
        metaTagMutationMock(captured), // delete
        ...transportMocks(newUrl),
        metaTagMutationMock(captured), // re-upload
      ],
      { meta_tag_image_url: oldUrl },
      <MetaTagHarness
        initialValue="meta_tag_image.png"
        onCommitted={onCommitted}
      />,
    );

    await waitFor(() =>
      expect(screen.getByAltText("image preview")).toHaveAttribute(
        "src",
        oldUrl,
      ),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Delete meta_tag_image.png" }),
    );
    await waitFor(() => expect(onCommitted).toHaveBeenCalledWith(null));

    const file = new File(["fresh"], "meta.png", { type: "image/png" });
    await act(async () => {
      await mockAcceptedUpload!(file);
    });

    // Same object key, new signature: the browser is forced to fetch the new
    // pixels (the signed response also carries the no-store override
    // server-side).
    expect(onCommitted).toHaveBeenLastCalledWith("meta_tag_image.png");
    expect(readImagesCache(client)?.meta_tag_image_url).toBe(newUrl);
    expect(await screen.findByAltText("image preview")).toHaveAttribute(
      "src",
      newUrl,
    );
    expect(captured).toEqual([
      expect.objectContaining({ meta_tag_image_url: "" }),
      expect.objectContaining({ meta_tag_image_url: "meta_tag_image.png" }),
    ]);
  });
});
// #endregion
