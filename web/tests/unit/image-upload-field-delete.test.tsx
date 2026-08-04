/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

// #region Mocks
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
        getImage: jest.fn(),
        uploadViaPresignedPost: jest.fn(),
      }),
    };
  },
);
// #endregion

import { ImageUploadField } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/ImageUploadField";

// #region Test Data
const IMAGE_PATH = "showcase_img_1.png";

const renderField = (callbacks: {
  onAutosave: jest.Mock<Promise<void>, [string[]]>;
  onChange: jest.Mock<void, [string[]]>;
  onRefetchImages: jest.Mock<Promise<void>, []>;
}) => {
  const rendered = render(
    <ImageUploadField
      value={[IMAGE_PATH]}
      onChange={callbacks.onChange}
      onAutosave={callbacks.onAutosave}
      appId="app_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
      teamId="team_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
      isAppVerified={false}
      unverifiedImageUrls={[
        `https://signed.test/${IMAGE_PATH}?version=current`,
      ]}
      isImagesLoading={false}
      onRefetchImages={callbacks.onRefetchImages}
      maxImages={3}
      imageConstraints={{
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
        recommendedSize: "1080x1080px",
      }}
      imageTypeNamer={(index) => `showcase_img_${index + 1}`}
      title="Showcase Images"
      description="Upload showcase images."
    />,
  );

  const previewButton = screen.getByRole("button", {
    name: "View full resolution",
  });
  const deleteButton = within(previewButton.parentElement!).getAllByRole(
    "button",
  )[1];

  return { ...rendered, deleteButton };
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// #region Delete persistence and refresh failures
describe("ImageUploadField [delete]", () => {
  it("commits local deletion when persistence succeeds but refresh fails", async () => {
    const refreshError = new Error("signed URL refresh failed");
    const onAutosave = jest.fn<Promise<void>, [string[]]>().mockResolvedValue();
    const onChange = jest.fn<void, [string[]]>();
    const onRefetchImages = jest
      .fn<Promise<void>, []>()
      .mockRejectedValue(refreshError);
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { deleteButton } = renderField({
      onAutosave,
      onChange,
      onRefetchImages,
    });

    fireEvent.click(deleteButton);

    await waitFor(() => expect(onChange).toHaveBeenCalledWith([]));
    expect(onAutosave).toHaveBeenCalledWith([]);
    expect(onRefetchImages).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).not.toHaveBeenCalledWith(
      "Couldn't remove that image. Please try again.",
    );
    expect(consoleError).toHaveBeenCalledWith(
      "image removed but post-delete refresh failed:",
      refreshError,
      "— image is persisted; UI will catch up on next fetch",
    );
  });

  it("keeps local state and skips refresh when persistence fails", async () => {
    const onAutosave = jest
      .fn<Promise<void>, [string[]]>()
      .mockRejectedValue(new Error("metadata update failed"));
    const onChange = jest.fn<void, [string[]]>();
    const onRefetchImages = jest.fn<Promise<void>, []>();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { deleteButton } = renderField({
      onAutosave,
      onChange,
      onRefetchImages,
    });

    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Couldn't remove that image. Please try again.",
      ),
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(onRefetchImages).not.toHaveBeenCalled();
  });
});
// #endregion
