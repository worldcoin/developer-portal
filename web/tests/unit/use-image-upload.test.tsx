/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { MockedProvider } from "@apollo/client/testing/react";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";

// #region Mocks
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));

jest.mock("react-toastify", () => ({
  toast: Object.assign(jest.fn(), { error: jest.fn() }),
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

import { UploadImageDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/hook/graphql/client/upload-image.generated";
import { useImage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image";

// #region Test Data
const variables = {
  app_id: "app_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  image_type: "showcase_img_1",
  content_type_ending: "png",
  team_id: "team_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  locale: "en",
};

// Deliberately the ONLY mock: the optimal upload flow makes exactly one
// GraphQL request (the presigned-POST signing). Any reintroduced post-upload
// request (the old refetch / trailing GetUploadedImage) finds no mock,
// rejects, and fails this test.
const mocks = [
  {
    request: { query: UploadImageDocument, variables },
    result: {
      data: {
        upload_image: {
          url: "https://s3.test/upload",
          stringifiedFields: JSON.stringify({ key: "some-key" }),
        },
      },
    },
  },
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <MockedProvider mocks={mocks}>{children}</MockedProvider>
);
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  // The presigned POST goes straight to S3; stub it as a success.
  global.fetch = jest
    .fn()
    .mockResolvedValue({ ok: true, text: async () => "" }) as never;
});

// #region upload flow
describe("useImage.uploadViaPresignedPost", () => {
  it("completes on a fresh hook instance with a single signing request", async () => {
    // Regression 1: the flow used to end with refetch() on the never-executed
    // GetUploadedImage lazy query — Apollo 4 throws "refetch cannot be called
    // before executing the query", crashing every first upload.
    // Regression 2: its replacement re-requested the download URL and threw
    // away the result, so a failed redundant request reported upload failure
    // AFTER S3 had accepted the file.
    const { result } = renderHook(() => useImage(), { wrapper });

    const file = new File(["binary"], "showcase.png", { type: "image/png" });

    await expect(
      result.current.uploadViaPresignedPost(
        file,
        variables.app_id,
        variables.team_id,
        variables.image_type,
        variables.locale,
      ),
    ).resolves.not.toThrow();

    // The S3 POST itself must have happened — it is the upload confirmation.
    expect(global.fetch).toHaveBeenCalledWith(
      "https://s3.test/upload",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects when S3 refuses the upload", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: async () => "expired policy",
    });

    const { result } = renderHook(() => useImage(), { wrapper });
    const file = new File(["binary"], "showcase.png", { type: "image/png" });

    await expect(
      result.current.uploadViaPresignedPost(
        file,
        variables.app_id,
        variables.team_id,
        variables.image_type,
        variables.locale,
      ),
    ).rejects.toThrow("Failed to upload file: 403");
  });
});
// #endregion
