/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getDefaultStore } from "jotai";
import React from "react";

// #region Mocks
const push = jest.fn();
const createEditableRow = jest.fn();
const fetchImages = jest.fn();
const useFetchAppMetadataQuery = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId, appId }),
  useRouter: () => ({ push }),
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({
    user: {
      hasura: {
        memberships: [{ team: { id: teamId }, role: "OWNER" }],
      },
    },
  }),
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated",
  () => ({
    FetchAppMetadataDocument: {},
    useFetchAppMetadataQuery: (...args: unknown[]) =>
      useFetchAppMetadataQuery(...args),
  }),
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/AppTopBar/graphql/client/create-editable-row.generated",
  () => ({
    useCreateEditableRowMutation: () => [createEditableRow],
  }),
);

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-images.generated",
  () => ({
    useFetchImagesLazyQuery: () => [fetchImages],
  }),
);

const toastSuccess = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));
// #endregion

const teamId = "team_1";
const appId = "app_9cdd0a714aec9ed17dca660bc9ffe72a";

import { AppVersionsPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Versions/page";
import {
  unverifiedImageAtom,
  viewModeAtom,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout/ImagesProvider";

// #region Test Data
const metadata = (
  status: "unverified" | "awaiting_review" | "changes_requested" | "verified",
) => ({
  id: `metadata-${status}`,
  name: "Sample app",
  verification_status: status,
  verified_at: status === "verified" ? "2026-06-18T12:00:00.000Z" : null,
  review_message:
    status === "awaiting_review" ? "Please confirm the support URL" : "",
});

const app = ({
  draft,
  verified,
}: {
  draft?: ReturnType<typeof metadata>;
  verified?: ReturnType<typeof metadata>;
}) => ({
  id: appId,
  app_metadata: draft ? [draft] : [],
  verified_app_metadata: verified ? [verified] : [],
});

const renderPage = () => render(<AppVersionsPage params={{ teamId, appId }} />);
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  getDefaultStore().set(viewModeAtom, "unverified");
  createEditableRow.mockResolvedValue({
    data: { create_new_draft: { success: true } },
  });
  fetchImages.mockResolvedValue({
    data: {
      unverified_images: {
        logo_img_url: "logo.png",
        showcase_img_urls: ["showcase.png"],
        meta_tag_image_url: "meta.png",
        content_card_image_url: "card.png",
      },
    },
  });
});

// #region Version states
describe("v3 Configuration versions [states]", () => {
  it("offers a new draft when only an approved version exists", () => {
    useFetchAppMetadataQuery.mockReturnValue({
      data: { app: [app({ verified: metadata("verified") })] },
      loading: false,
      error: undefined,
    });

    renderPage();

    expect(screen.getByText("Approved version")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: "App versions" }),
    ).toBeInTheDocument();
    for (const column of [
      "App name",
      "Verified at",
      "Status",
      "Review message",
    ]) {
      expect(
        screen.getByRole("columnheader", { name: column }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: "Create new draft" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Configuration" }));
    expect(push).toHaveBeenCalledWith(
      `/teams/${teamId}/apps/${appId}/configuration`,
    );
    expect(screen.queryByText("Current update")).not.toBeInTheDocument();
  });

  it("shows an approved version and the submitted update without another create action", () => {
    useFetchAppMetadataQuery.mockReturnValue({
      data: {
        app: [
          app({
            draft: metadata("awaiting_review"),
            verified: metadata("verified"),
          }),
        ],
      },
      loading: false,
      error: undefined,
    });

    renderPage();

    expect(screen.getByText("Current update")).toBeInTheDocument();
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(
      screen.getByText("Please confirm the support URL"),
    ).toBeInTheDocument();
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("Jun 18, 2026")).toBeInTheDocument();
    expect(screen.getByText("Approved version")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create new draft" }),
    ).not.toBeInTheDocument();
  });

  it("creates the draft, refreshes its images, and opens the editor", async () => {
    useFetchAppMetadataQuery.mockReturnValue({
      data: { app: [app({ verified: metadata("verified") })] },
      loading: false,
      error: undefined,
    });

    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Create new draft" }));

    await waitFor(() => {
      expect(createEditableRow).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { app_id: appId, team_id: teamId },
          awaitRefetchQueries: true,
        }),
      );
    });
    expect(fetchImages).toHaveBeenCalledWith({
      variables: { id: appId, team_id: teamId },
    });
    expect(getDefaultStore().get(viewModeAtom)).toBe("unverified");
    expect(getDefaultStore().get(unverifiedImageAtom)).toEqual({
      logo_img_url: "logo.png",
      showcase_image_urls: ["showcase.png"],
      meta_tag_image_url: "meta.png",
      content_card_image_url: "card.png",
    });
    expect(push).toHaveBeenCalledWith(
      `/teams/${teamId}/apps/${appId}/configuration`,
    );
    expect(toastSuccess).toHaveBeenCalledWith("New app draft created");
  });
});
// #endregion
