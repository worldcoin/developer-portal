/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { TextEncoder } from "node:util";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import { ReviewerQueue } from "@/scenes/Admin/reviewer/queue/ReviewerQueue";
import { ReviewClaimBar } from "@/scenes/Admin/reviewer/detail/ReviewClaimBar";
import { ReviewHistory } from "@/scenes/Admin/reviewer/detail/ReviewHistory";
import { ReviewTestPanel } from "@/scenes/Admin/reviewer/detail/ReviewTestPanel";
import { ReviewerWorkspace } from "@/scenes/Admin/reviewer/detail/ReviewerWorkspace";
import { parseReviewerQueueFilters } from "@/scenes/Admin/reviewer/queue-filters";
import type { ReviewerSubmissionDetail } from "@/scenes/Admin/reviewer/types";

Object.defineProperty(global, "TextEncoder", {
  configurable: true,
  value: TextEncoder,
});

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(global, "ResizeObserver", {
  configurable: true,
  value: TestResizeObserver,
});

const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/admin/reviewer/00000000-0000-4000-8000-000000000001",
  useRouter: () => ({ refresh: mockRefresh }),
}));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

beforeEach(() => {
  jest.restoreAllMocks();
  window.sessionStorage.clear();
});

describe("review queue workspace", () => {
  it("renders status tabs, filter controls, and FIFO rows", () => {
    render(
      <ReviewerQueue
        currentUserEmail="reviewer@example.com"
        filters={parseReviewerQueueFilters({ status: "all" })}
        hasNextPage
        submissions={[
          {
            id: "review-newer",
            appId: "app_2",
            appMetadataId: "metadata_2",
            appName: "Newer app",
            appMode: "external",
            attempt: 1,
            changelog: "Second",
            claimedByEmail: null,
            claimExpiresAt: null,
            listingTarget: "world_ecosystem",
            reviewVersion: 1,
            status: "pending",
            submittedAt: "2026-08-22T12:00:00.000Z",
            teamId: "team_2",
            teamName: "Beta",
          },
          {
            id: "review-oldest",
            appId: "app_1",
            appMetadataId: "metadata_1",
            appName: "Oldest app",
            appMode: "mini-app",
            attempt: 1,
            changelog: "First",
            claimedByEmail: null,
            claimExpiresAt: null,
            listingTarget: "mini_app_store",
            reviewVersion: 1,
            status: "pending",
            submittedAt: "2026-08-20T12:00:00.000Z",
            teamId: "team_1",
            teamName: "Alpha",
          },
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Pending" })).toHaveAttribute(
      "href",
      expect.stringContaining("status=pending"),
    );
    expect(screen.getByRole("link", { name: "Mine" })).toBeInTheDocument();
    expect(screen.getByLabelText("App mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Team")).toBeInTheDocument();
    expect(screen.getByLabelText("Submission age")).toBeInTheDocument();
    expect(screen.getByLabelText("Assignee")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveValue("all");

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByText("Oldest app")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Newer app")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      expect.stringContaining("page=2"),
    );
  });
});

describe("review test panel", () => {
  it("shows the exact Mini App QR, copy, and open target", () => {
    render(
      <ReviewTestPanel
        appId="app_123"
        metadataId="metadata_456"
        mode="mini-app"
        integrationUrl="https://mini.example.com"
      />,
    );

    const expected =
      "https://world.org/mini-app?app_id=app_123&path=&draft_id=metadata_456";
    expect(
      screen.getByLabelText("World App draft QR code"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open draft in World App" }),
    ).toHaveAttribute("href", expected);
    expect(
      screen.getByRole("button", { name: "Copy draft link" }),
    ).toBeEnabled();
  });

  it("shows an HTTPS external URL without any World App QR", () => {
    render(
      <ReviewTestPanel
        appId="app_123"
        metadataId="metadata_456"
        mode="external"
        integrationUrl="https://external.example.com/integration"
      />,
    );

    expect(
      screen.queryByLabelText("World App draft QR code"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open integration" }),
    ).toHaveAttribute("href", "https://external.example.com/integration");
  });
});

describe("reviewer mutation controls", () => {
  it("keeps claim and decision controls disabled for read-only admins", () => {
    render(
      <ReviewClaimBar
        canReview={false}
        claimExpiresAt={null}
        claimedByEmail={null}
        currentUserEmail="reader@example.com"
        reviewId="00000000-0000-4000-8000-000000000001"
        reviewVersion={1}
        status="pending"
      />,
    );

    expect(
      screen.getByText(/reviewer access is required/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claim review" })).toBeDisabled();
  });

  it("allows a reviewer to take over an expired claim", () => {
    render(
      <ReviewClaimBar
        canReview
        claimExpiresAt="2000-01-01T00:00:00.000Z"
        claimedByEmail="former-reviewer@example.com"
        currentUserEmail="reviewer@example.com"
        reviewId="00000000-0000-4000-8000-000000000001"
        reviewVersion={4}
        status="in_review"
      />,
    );

    expect(screen.getAllByText(/lease expired/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Claim review" })).toBeEnabled();
  });
});

describe("review history", () => {
  it("renders immutable events in event-sequence order and exposes retry only to reviewers", () => {
    const props = {
      canReview: false,
      events: [
        {
          id: "first",
          eventType: "submitted",
          eventSequence: 1,
          actorEmail: "dev@example.com",
          createdAt: "2026-08-20T12:00:00.000Z",
          payload: {},
          reviewVersion: 1,
        },
        {
          id: "second",
          eventType: "claimed",
          eventSequence: 2,
          actorEmail: "reviewer@example.com",
          createdAt: "2026-08-21T12:00:00.000Z",
          payload: {},
          reviewVersion: 2,
        },
      ],
      notifications: [
        {
          id: "notification-1",
          attemptCount: 2,
          channel: "email",
          createdAt: "2026-08-21T13:00:00.000Z",
          lastError: "Provider unavailable",
          notificationType: "decision_approved",
          recipient: "owner@example.com",
          status: "failed",
        },
      ],
    };

    const { container } = render(<ReviewHistory {...props} />);
    const eventHeadings = Array.from(
      container.querySelectorAll("[data-review-event]"),
    ).map((node) => node.textContent);
    expect(eventHeadings[0]).toContain("Claimed");
    expect(eventHeadings[1]).toContain("Submitted");
    expect(
      screen.getByRole("button", { name: "Retry email notification" }),
    ).toBeDisabled();

    fireEvent.click(screen.getByText("Delivery attempts"));
    expect(screen.getByText("Provider unavailable")).toBeInTheDocument();
  });
});

const detailFixture: ReviewerSubmissionDetail = {
  id: "00000000-0000-4000-8000-000000000001",
  appId: "app_123",
  appMetadataId: "metadata_456",
  appName: "Draft app",
  appMode: "mini-app",
  attempt: 2,
  changelog: "Updated Spanish listing and checkout flow.",
  checklist: { items: [], internalNotes: "" },
  checklistVersion: null,
  claimedAt: null,
  claimedByEmail: null,
  claimExpiresAt: null,
  completedAt: null,
  decidedAt: null,
  decidedByEmail: null,
  decisionSummary: null,
  events: [
    {
      id: "event-1",
      eventType: "submitted",
      eventSequence: 1,
      actorEmail: "dev@example.com",
      createdAt: "2026-08-20T12:00:00.000Z",
      payload: {},
      reviewVersion: 1,
    },
  ],
  listingConsent: true,
  listingTarget: "mini_app_store",
  localizationsSnapshot: [
    {
      locale: "es",
      name: "Aplicacion borrador",
      description: "Descripcion borrador",
    },
  ],
  metadataSnapshot: {
    name: "Draft app",
    integration_url: "https://mini.example.com",
    supported_languages: ["en", "es"],
    contracts: ["0x123"],
  },
  metadataUpdatedAt: "2026-08-20T12:00:00.000Z",
  notifications: [],
  liveMetadata: {
    name: "Live app",
    integration_url: "https://mini.example.com",
    supported_languages: ["en"],
  },
  liveLocalizations: [{ locale: "es", name: "Aplicacion publicada" }],
  reviewVersion: 1,
  status: "pending",
  submittedAt: "2026-08-20T12:00:00.000Z",
  teamId: "team_1",
  teamName: "Alpha",
  worldIdConfiguration: {
    legacyActions: [
      {
        id: "action_1",
        action: "verify",
        appFlowOnComplete: null,
        creationMode: "dashboard",
        description: "Verify once",
        kioskEnabled: false,
        maxAccountsPerUser: 1,
        maxVerifications: 1,
        name: "Verify",
        postActionDeepLinkAndroid: null,
        postActionDeepLinkIos: null,
        privacyPolicyUri: "https://mini.example.com/privacy",
        status: "active",
        termsUri: "https://mini.example.com/terms",
        webhookUri: null,
      },
    ],
    registrations: [],
  },
};

describe("review detail workspace", () => {
  it("requests fresh signed assets only when the Metadata tab is opened", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ assets: [] }),
    } as Response);

    render(
      <ReviewerWorkspace
        canReview={false}
        currentUserEmail="reader@example.com"
        submission={detailFixture}
      />,
    );

    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("tab", { name: "Metadata" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/admin/reviewer/submissions/${detailFixture.id}/assets`,
        expect.objectContaining({ cache: "no-store" }),
      ),
    );
    expect(
      await screen.findByText("No image filenames submitted."),
    ).toBeInTheDocument();
  });

  it("keeps claim state across tabs and renders diffs, localizations, signed assets, checklist rules, and history", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input) => {
        if (String(input).endsWith("/assets")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              assets: [
                {
                  id: "en:logo:0",
                  kind: "logo",
                  label: "App logo",
                  locale: "en",
                  signedUrl: "https://signed.example/logo.png",
                },
              ],
            }),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            submission: {
              id: detailFixture.id,
              status: "in_review",
              reviewVersion: 2,
              claimToken: "00000000-0000-4000-8000-000000000099",
              claimExpiresAt: "2026-08-27T13:00:00.000Z",
              checklistVersion: null,
              checklist: {},
            },
          }),
        } as Response;
      });

    const { container } = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={detailFixture}
      />,
    );

    expect(screen.getByText("Draft vs live changes")).toBeInTheDocument();
    expect(screen.getAllByText("Draft app").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Live app").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Claim review" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("tab", { name: "Metadata" }));
    expect(screen.getByText("Aplicacion borrador")).toBeInTheDocument();
    expect(await screen.findByAltText("App logo, English")).toHaveAttribute(
      "src",
      "https://signed.example/logo.png",
    );
    expect(screen.getByText("0x123")).toBeInTheDocument();
    expect(screen.getByText("action_1")).toBeInTheDocument();
    expect(screen.getByText("Verify once")).toBeInTheDocument();
    expect(
      screen.getByText("https://mini.example.com/privacy"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Guidelines" }));
    const firstStatus = screen.getAllByLabelText(/check status/i)[0];
    fireEvent.change(firstStatus, { target: { value: "na" } });
    const applicabilityNote =
      screen.getAllByLabelText(/applicability note/i)[0];
    expect(applicabilityNote).toBeInTheDocument();
    fireEvent.change(applicabilityNote, {
      target: { value: "No user-facing metadata applies to this test." },
    });

    const approve = screen.getByRole("button", { name: "Approve" });
    expect(approve).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Override reason"), {
      target: { value: "Partner exception approved by policy owner." },
    });
    expect(
      screen.getByText(/save checklist changes before deciding/i),
    ).toBeInTheDocument();
    expect(approve).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Save checklist" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/checklist"),
        expect.objectContaining({ method: "PUT" }),
      ),
    );
    expect(approve).toBeEnabled();

    fireEvent.click(screen.getByRole("tab", { name: "History" }));
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText(/claimed by you/i)).toBeInTheDocument();

    const rail = container.querySelector("[data-review-decision-rail]");
    expect(rail).toHaveClass("lg:sticky");
    expect(rail).not.toHaveClass("sticky");
  });

  it("recovers a matching claim token from the current tab session after refresh", () => {
    const claimedSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      status: "in_review",
      reviewVersion: 7,
      claimedByEmail: "reviewer@example.com",
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
    };
    window.sessionStorage.setItem(
      `admin-reviewer-claim:${detailFixture.id}`,
      JSON.stringify({
        claimToken: "00000000-0000-4000-8000-000000000099",
        claimExpiresAt: "2999-01-01T00:00:00.000Z",
        reviewVersion: 7,
      }),
    );

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );

    expect(screen.getByText("Claimed by you")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Release claim" })).toBeEnabled();
  });

  it("clears a recovered token and refreshes after a workflow conflict", async () => {
    const claimedSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      status: "in_review",
      reviewVersion: 7,
      claimedByEmail: "reviewer@example.com",
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
    };
    window.sessionStorage.setItem(
      `admin-reviewer-claim:${detailFixture.id}`,
      JSON.stringify({
        claimToken: "00000000-0000-4000-8000-000000000099",
        claimExpiresAt: "2999-01-01T00:00:00.000Z",
        reviewVersion: 7,
      }),
    );
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 409,
    } as Response);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Release claim" }));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(
      window.sessionStorage.getItem(`admin-reviewer-claim:${detailFixture.id}`),
    ).toBeNull();
  });

  it("waits for an in-flight heartbeat and uses its new version for release", async () => {
    const claimedSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      status: "in_review",
      reviewVersion: 7,
      claimedByEmail: "reviewer@example.com",
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
    };
    const claimToken = "00000000-0000-4000-8000-000000000099";
    window.sessionStorage.setItem(
      `admin-reviewer-claim:${detailFixture.id}`,
      JSON.stringify({
        claimToken,
        claimExpiresAt: "2999-01-01T00:00:00.000Z",
        reviewVersion: 7,
      }),
    );

    let resolveHeartbeat: ((response: Response) => void) | undefined;
    const heartbeatResponse = new Promise<Response>((resolve) => {
      resolveHeartbeat = resolve;
    });
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input) => {
        const path = String(input);
        if (path.endsWith("/heartbeat")) return heartbeatResponse;
        if (path.endsWith("/release")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              submission: {
                status: "pending",
                reviewVersion: 9,
                claimToken: null,
                claimExpiresAt: null,
              },
            }),
          } as Response;
        }
        throw new Error(`Unexpected request: ${path}`);
      });

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );
    await screen.findByText("Claimed by you");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/heartbeat"),
        expect.anything(),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Release claim" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveHeartbeat?.({
      ok: true,
      status: 200,
      json: async () => ({
        submission: {
          status: "in_review",
          reviewVersion: 8,
          claimToken,
          claimExpiresAt: "2999-01-01T00:00:00.000Z",
        },
      }),
    } as Response);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/release"),
        expect.objectContaining({
          body: JSON.stringify({
            claimToken,
            expectedReviewVersion: 8,
          }),
        }),
      ),
    );
  });

  it("reconciles workflow and checklist state when refreshed props change", async () => {
    const { rerender } = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={detailFixture}
      />,
    );

    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={{
          ...detailFixture,
          checklist: { internalNotes: "Saved on the server", items: [] },
          reviewVersion: 2,
          status: "approved",
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("approved")).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Internal notes")).toHaveValue(
      "Saved on the server",
    );
    expect(screen.getByRole("button", { name: "Claim review" })).toBeDisabled();
  });
});
