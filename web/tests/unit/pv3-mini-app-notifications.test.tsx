/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { NotificationsPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/Notifications/page";

const appId = "app_1234567890abcdef1234567890abcdef";
const teamId = "team_1234567890abcdef1234567890abcdef";
const draftId = "meta_draft";
const mockUseFetchNotificationAppMetadataQuery = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ appId, teamId }),
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/MiniApp/Notifications/graphql/client/fetch-notification-app-metadata.generated",
  () => ({
    FetchNotificationAppMetadataDocument: {},
  }),
);

// AC4: the page calls useQuery(FetchNotificationAppMetadataDocument) from
// @apollo/client/react. Route it to the same data fn the tests configure.
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) =>
    mockUseFetchNotificationAppMetadataQuery(...args),
}));

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const draftMetadata = {
  id: draftId,
  verification_status: "unverified",
  app_mode: "mini-app",
  category: null,
};

const verifiedMetadata = {
  id: "meta_verified",
  verification_status: "verified",
  verified_at: "2026-01-01T00:00:00.000Z",
  app_mode: "mini-app",
  category: null,
};

const setMetadata = ({
  draft = false,
  verified = false,
  draftAppMode = "mini-app",
  verifiedAppMode = "mini-app",
  category = null,
}: {
  draft?: boolean;
  verified?: boolean;
  draftAppMode?: "mini-app" | "external";
  verifiedAppMode?: "mini-app" | "external";
  category?: string | null;
}) => {
  mockUseFetchNotificationAppMetadataQuery.mockReturnValue({
    loading: false,
    data: {
      app: [
        {
          id: appId,
          app_metadata: draft
            ? [{ ...draftMetadata, app_mode: draftAppMode, category }]
            : [],
          verified_app_metadata: verified
            ? [{ ...verifiedMetadata, app_mode: verifiedAppMode, category }]
            : [],
        },
      ],
    },
  });
};

const submitNotification = async () => {
  fireEvent.change(
    screen.getByPlaceholderText("Enter wallet addresses separated by commas"),
    { target: { value: "0x0000000000000000000000000000000000000001" } },
  );
  fireEvent.change(screen.getByPlaceholderText("Notification title"), {
    target: { value: "Test notification" },
  });
  fireEvent.change(screen.getByPlaceholderText("Notification message"), {
    target: { value: "Testing the Mini App" },
  });
  fireEvent.change(screen.getByPlaceholderText("Mini App Path"), {
    target: { value: `worldapp://mini-app?app_id=${appId}` },
  });
  fireEvent.change(screen.getByPlaceholderText("API Key"), {
    target: { value: "api_test" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send notification" }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

  const request = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
  return JSON.parse(request.body as string) as Record<string, unknown>;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ success: true }),
  } as Response);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// #region Metadata states
describe("NotificationsPage metadata states", () => {
  it("shows a loading state without a misleading verification notice", () => {
    mockUseFetchNotificationAppMetadataQuery.mockReturnValue({
      data: undefined,
      loading: true,
    });

    render(<NotificationsPage />);

    expect(
      screen.queryByRole("button", { name: "Send notification" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Verify your Mini App first"),
    ).not.toBeInTheDocument();
  });

  it("keeps external apps blocked", () => {
    setMetadata({ draft: true, draftAppMode: "external" });

    render(<NotificationsPage />);

    expect(screen.getByText("Notifications unavailable")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send notification" }),
    ).not.toBeInTheDocument();
  });

  it("does not treat the External store category as external app mode", () => {
    setMetadata({ draft: true, category: "External" });

    render(<NotificationsPage />);

    expect(
      screen.getByRole("button", { name: "Send notification" }),
    ).toBeInTheDocument();
  });

  it("uses verified Mini App metadata before an external draft", () => {
    setMetadata({
      draft: true,
      verified: true,
      draftAppMode: "external",
    });

    render(<NotificationsPage />);

    expect(
      screen.getByRole("button", { name: "Send notification" }),
    ).toBeInTheDocument();
  });

  it("uses verified external metadata before a Mini App draft", () => {
    setMetadata({
      draft: true,
      verified: true,
      verifiedAppMode: "external",
    });

    render(<NotificationsPage />);

    expect(screen.getByText("Notifications unavailable")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Send notification" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion

// #region Version-specific submissions
describe("NotificationsPage version-specific submissions", () => {
  it("renders draft-only apps and includes their draft_id", async () => {
    setMetadata({ draft: true });

    render(<NotificationsPage />);

    expect(await submitNotification()).toMatchObject({ draft_id: draftId });
  });

  it("does not include draft_id for verified-only apps", async () => {
    setMetadata({ verified: true });

    render(<NotificationsPage />);

    expect(await submitNotification()).not.toHaveProperty("draft_id");
  });

  it("uses verified metadata when both versions exist", async () => {
    setMetadata({ draft: true, verified: true });

    render(<NotificationsPage />);

    expect(await submitNotification()).not.toHaveProperty("draft_id");
  });
});
// #endregion
