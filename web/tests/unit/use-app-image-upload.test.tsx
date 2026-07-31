/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { MockLink } from "@apollo/client/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

// #region Mocks
const posthogCaptureMock = jest.fn();
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: (...args: unknown[]) => posthogCaptureMock(...args) },
}));

const toastErrorMock = jest.fn();
jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

// lib/utils transitively imports IDKit/ox, which needs TextEncoder (absent in
// jsdom). The hook only uses tryParseJSON; mock it faithfully.
jest.mock("@/lib/utils", () => ({
  tryParseJSON: (input: string) => {
    try {
      return JSON.parse(input);
    } catch {
      return null;
    }
  },
}));
// #endregion

import { GetUploadedImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/graphql/client/get-uploaded-image.generated";
import { UploadImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/graphql/client/upload-image.generated";
import { useAppImageUpload } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/use-app-image-upload";

// #region Test Data
const appId = "app_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const teamId = "team_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const signedUrl =
  "https://assets.test/unverified/app/showcase_img_1.png?signature=fresh";

// Deliberately the ONLY GraphQL mocks: the transaction makes exactly one
// signing request and one signed-URL request. Any reintroduced refetch finds
// no mock and fails loudly.
const mocks = [
  {
    request: { query: UploadImageDocument, variables: () => true },
    result: {
      data: {
        upload_image: {
          __typename: "PresignedPostOutput" as const,
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
          __typename: "GetUploadedImageOutput" as const,
          url: signedUrl,
        },
      },
    },
  },
];

// A hand-built client instead of MockedProvider: unmounting MockedProvider
// stops the client and kills in-flight requests, but in the app the client
// outlives any component — and the transaction must survive an unmount.
const createClient = () =>
  new ApolloClient({ link: new MockLink(mocks), cache: new InMemoryCache() });

const file = new File(["binary"], "showcase.png", { type: "image/png" });

type Deferred = {
  resolve: (value?: unknown) => void;
  reject: (error: unknown) => void;
  promise: Promise<unknown>;
};
const deferred = (): Deferred => {
  let resolve!: Deferred["resolve"];
  let reject!: Deferred["reject"];
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { resolve, reject, promise };
};

/** Abort-aware S3 POST stub gated on a deferred so tests control timing. */
const stubS3 = (gate: Deferred) => {
  global.fetch = jest.fn(
    (_url: unknown, init?: RequestInit) =>
      new Promise((resolve, reject) => {
        const abort = () => reject(new DOMException("Aborted", "AbortError"));
        if (init?.signal?.aborted) return abort();
        init?.signal?.addEventListener("abort", abort);
        gate.promise.then(
          () => resolve({ ok: true, text: async () => "" }),
          reject,
        );
      }),
  ) as never;
};

const renderUpload = () => {
  const client = createClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  );
  return renderHook(() => useAppImageUpload({ appId, teamId }), { wrapper });
};
// #endregion

let createdBlobUrls: string[];

beforeEach(() => {
  jest.clearAllMocks();
  createdBlobUrls = [];
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: jest.fn(() => {
      const url = `blob:mock-${createdBlobUrls.length + 1}`;
      createdBlobUrls.push(url);
      return url;
    }),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: jest.fn(),
  });
});

// #region optimistic preview
describe("useAppImageUpload [optimistic preview]", () => {
  it("shows the blob preview before any upload/metadata promise resolves", async () => {
    const s3Gate = deferred();
    stubS3(s3Gate);
    const { result } = renderUpload();

    const persist = jest.fn().mockResolvedValue(undefined);
    const applyOptimisticPreview = jest.fn(() => jest.fn());

    let uploadPromise!: Promise<boolean>;
    act(() => {
      uploadPromise = result.current.upload({
        file,
        imageType: "showcase_img_1",
        persist,
        commit: jest.fn(),
        applyOptimisticPreview,
      });
    });

    // Nothing has settled: S3 is gated, so persistence can't have started —
    // yet the blob preview is already up.
    expect(result.current.pendingPreviewUrl).toBe("blob:mock-1");
    expect(applyOptimisticPreview).toHaveBeenCalledWith("blob:mock-1");
    expect(persist).not.toHaveBeenCalled();
    expect(result.current.isUploading).toBe(true);

    s3Gate.resolve();
    await act(async () => {
      await uploadPromise;
    });
  });
});
// #endregion

// #region success path
describe("useAppImageUpload [success]", () => {
  it("persists the derived file name, commits the signed URL, then replaces and revokes the blob", async () => {
    const s3Gate = deferred();
    s3Gate.resolve();
    stubS3(s3Gate);
    const { result } = renderUpload();

    const persist = jest.fn().mockResolvedValue(undefined);
    const commit = jest.fn();

    let succeeded = false;
    await act(async () => {
      succeeded = await result.current.upload({
        file,
        imageType: "showcase_img_1",
        persist,
        commit,
      });
    });

    expect(succeeded).toBe(true);
    // The file name comes from the image type + file type, never from
    // parsing the signed preview URL.
    expect(persist).toHaveBeenCalledWith("showcase_img_1.png");
    expect(commit).toHaveBeenCalledWith({
      fileName: "showcase_img_1.png",
      signedUrl,
    });
    // Persistence strictly precedes the commit of form/cache state.
    expect(persist.mock.invocationCallOrder[0]).toBeLessThan(
      commit.mock.invocationCallOrder[0],
    );
    // The blob is replaced by the signed URL and revoked.
    expect(result.current.pendingPreviewUrl).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    // The S3 POST happened — it is the upload confirmation.
    expect(global.fetch).toHaveBeenCalledWith(
      "https://s3.test/upload",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
// #endregion

// #region failure rollback
describe("useAppImageUpload [failure rollback]", () => {
  it("rolls back the preview and never persists when S3 refuses the upload", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => "expired policy",
    }) as never;
    const { result } = renderUpload();

    const persist = jest.fn();
    const commit = jest.fn();
    const restore = jest.fn();
    const onError = jest.fn();

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.upload({
        file,
        imageType: "showcase_img_1",
        persist,
        commit,
        applyOptimisticPreview: () => restore,
        onError,
      });
    });

    expect(succeeded).toBe(false);
    expect(persist).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(restore).toHaveBeenCalled();
    expect(result.current.pendingPreviewUrl).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(onError).toHaveBeenCalled();
  });

  it("rolls back the preview when the metadata mutation fails after S3 succeeded", async () => {
    const s3Gate = deferred();
    s3Gate.resolve();
    stubS3(s3Gate);
    const { result } = renderUpload();

    const persist = jest.fn().mockRejectedValue(new Error("mutation failed"));
    const commit = jest.fn();
    const restore = jest.fn();
    const onError = jest.fn();

    let succeeded = true;
    await act(async () => {
      succeeded = await result.current.upload({
        file,
        imageType: "showcase_img_1",
        persist,
        commit,
        applyOptimisticPreview: () => restore,
        onError,
      });
    });

    expect(succeeded).toBe(false);
    expect(commit).not.toHaveBeenCalled();
    expect(restore).toHaveBeenCalled();
    expect(result.current.pendingPreviewUrl).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
// #endregion

// #region unmount semantics
describe("useAppImageUpload [unmount semantics]", () => {
  it("finishes persistence without a cancellation toast when unmounted after S3 accepted", async () => {
    const s3Gate = deferred();
    stubS3(s3Gate);
    const { result, unmount } = renderUpload();

    const persistGate = deferred();
    const persist = jest.fn(() => persistGate.promise);
    const commit = jest.fn();

    let uploadPromise!: Promise<boolean>;
    act(() => {
      uploadPromise = result.current.upload({
        file,
        imageType: "showcase_img_1",
        persist,
        commit,
      });
    });

    // Let S3 accept the file, then unmount while persistence is in flight.
    await act(async () => {
      s3Gate.resolve();
    });
    await waitFor(() => expect(persist).toHaveBeenCalled());
    unmount();

    persistGate.resolve();
    await expect(uploadPromise).resolves.toBe(true);
    expect(commit).toHaveBeenCalledWith({
      fileName: "showcase_img_1.png",
      signedUrl,
    });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("reports cancellation and rolls back when unmounted during the S3 POST", async () => {
    const s3Gate = deferred();
    stubS3(s3Gate);
    const { result, unmount } = renderUpload();

    const persist = jest.fn();
    const restore = jest.fn();

    let uploadPromise!: Promise<boolean>;
    act(() => {
      uploadPromise = result.current.upload({
        file,
        imageType: "showcase_img_1",
        persist,
        commit: jest.fn(),
        applyOptimisticPreview: () => restore,
      });
    });

    // The signing request must settle first so the POST is in flight.
    await act(async () => {
      await Promise.resolve();
    });
    unmount();

    await expect(uploadPromise).resolves.toBe(false);
    expect(persist).not.toHaveBeenCalled();
    expect(restore).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-1");
    expect(toastErrorMock).toHaveBeenCalledWith("Upload was cancelled", {
      autoClose: 5000,
    });
  });
});
// #endregion
