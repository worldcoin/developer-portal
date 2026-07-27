/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

// #region Mocks
const mockGetImage = jest.fn();
const mockUploadViaPresignedPost = jest.fn();
const mockToastError = jest.fn();
let mockAcceptedUpload: ((file: File) => Promise<boolean>) | undefined;

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

jest.mock("@/lib/utils", () => ({
  getCDNImageUrl: (_appId: string, path: string) => `https://cdn/${path}`,
}));

jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-image",
  () => ({
    useImage: () => ({
      getImage: mockGetImage,
      uploadViaPresignedPost: mockUploadViaPresignedPost,
    }),
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

import { ImageUploadField } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/ImageForm/ImageUploadField";

// #region Test Data
const appId = "app_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const teamId = "team_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6";
const onChange = jest.fn();
const onAutosave = jest.fn().mockResolvedValue(undefined);
const onRefetchImages = jest.fn().mockResolvedValue(undefined);

const renderField = ({
  key = "field",
  value = [],
  unverifiedImageUrls,
  maxImages = 3,
  locale = "en",
  onUploadSuccess,
}: {
  key?: string;
  value?: string[];
  unverifiedImageUrls?: string[];
  maxImages?: number;
  locale?: string;
  onUploadSuccess?: () => void;
}) => (
  <ImageUploadField
    key={key}
    value={value}
    onChange={onChange}
    onAutosave={onAutosave}
    appId={appId}
    teamId={teamId}
    locale={locale}
    isAppVerified={false}
    unverifiedImageUrls={unverifiedImageUrls}
    isImagesLoading={false}
    onRefetchImages={onRefetchImages}
    maxImages={maxImages}
    imageConstraints={{
      width: 1080,
      height: 1080,
      aspectRatio: "1:1",
      recommendedSize: "1080x1080px",
    }}
    imageTypeNamer={(count) => `showcase_img_${count + 1}`}
    title="Images"
    description="Upload images"
    onUploadSuccess={onUploadSuccess}
  />
);
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  mockAcceptedUpload = undefined;
  mockUploadViaPresignedPost.mockResolvedValue(undefined);
  mockGetImage.mockResolvedValue(
    "https://assets.example.com/unverified/app/showcase_img_1.png?signature=new",
  );
});

// #region Remount-safe previews
describe("ImageUploadField remount-safe previews", () => {
  it.each([
    [
      "showcase",
      3,
      "https://assets.example.com/unverified/app/showcase_img_1.png?signature=new",
      "showcase_img_1.png",
    ],
    [
      "meta tag",
      1,
      "https://assets.example.com/unverified/app/meta_tag_image.png?signature=new",
      "meta_tag_image.png",
    ],
  ])(
    "renders the refetched %s image when the successor form value is still empty",
    (_label, maxImages, signedUrl, imagePath) => {
      const view = render(
        renderField({
          key: "original-form",
          value: [],
          unverifiedImageUrls: undefined,
          maxImages,
        }),
      );

      expect(screen.queryByAltText("image preview")).not.toBeInTheDocument();

      view.rerender(
        renderField({
          key: "successor-form",
          value: [],
          unverifiedImageUrls: [signedUrl],
          maxImages,
        }),
      );

      expect(screen.getByAltText("image preview")).toHaveAttribute(
        "src",
        signedUrl,
      );
      expect(onChange).toHaveBeenCalledWith([imagePath]);
    },
  );

  it("uses the refetched paths when deleting after the form remount", async () => {
    const firstUrl =
      "https://assets.example.com/unverified/app/showcase_img_1.png?signature=one";
    const secondUrl =
      "https://assets.example.com/unverified/app/showcase_img_2.png?signature=two";

    render(
      renderField({
        value: [],
        unverifiedImageUrls: [firstUrl, secondUrl],
      }),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Delete showcase_img_1.png" }),
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(["showcase_img_2.png"]);
      expect(onAutosave).toHaveBeenCalledWith(["showcase_img_2.png"]);
      expect(onRefetchImages).toHaveBeenCalledTimes(1);
    });
  });

  it("rehydrates a new locale even when it uses the same fixed image path", () => {
    const view = render(
      renderField({
        value: ["showcase_img_1.png"],
        unverifiedImageUrls: [
          "https://assets.example.com/unverified/app/showcase_img_1.png?locale=en",
        ],
        locale: "en",
      }),
    );

    expect(onChange).not.toHaveBeenCalled();

    view.rerender(
      renderField({
        value: [],
        unverifiedImageUrls: [
          "https://assets.example.com/unverified/app/es/showcase_img_1.png?locale=es",
        ],
        locale: "es",
      }),
    );

    expect(onChange).toHaveBeenCalledWith(["showcase_img_1.png"]);
  });

  it("does not report cancellation when the form remounts after S3 succeeds", async () => {
    let finishAutosave: (() => void) | undefined;
    onAutosave.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishAutosave = resolve;
        }),
    );
    const onUploadSuccess = jest.fn();
    const view = render(
      renderField({
        key: "uploading-form",
        value: [],
        unverifiedImageUrls: undefined,
        onUploadSuccess,
      }),
    );
    const file = new File(["image"], "showcase.png", { type: "image/png" });

    let uploadPromise: Promise<boolean> | undefined;
    act(() => {
      uploadPromise = mockAcceptedUpload?.(file);
    });

    await waitFor(() => {
      expect(mockUploadViaPresignedPost).toHaveBeenCalled();
      expect(onAutosave).toHaveBeenCalledWith(["showcase_img_1.png"]);
    });

    view.rerender(
      renderField({
        key: "successor-form",
        value: [],
        unverifiedImageUrls: undefined,
        onUploadSuccess,
      }),
    );

    await act(async () => {
      finishAutosave?.();
      await uploadPromise;
    });

    expect(onUploadSuccess).toHaveBeenCalledTimes(1);
    expect(mockToastError).not.toHaveBeenCalledWith(
      "Upload was cancelled",
      expect.anything(),
    );
  });
});
// #endregion
