/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { TextEncoder } from "node:util";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";

import { ReviewerQueue } from "@/scenes/Admin/reviewer/queue/ReviewerQueue";
import { ReviewClaimBar } from "@/scenes/Admin/reviewer/detail/ReviewClaimBar";
import { ReviewHistory } from "@/scenes/Admin/reviewer/detail/ReviewHistory";
import { ReviewerHeader } from "@/scenes/Admin/reviewer/detail/ReviewerHeader";
import { ReviewerChecklist } from "@/scenes/Admin/reviewer/detail/ReviewerChecklist";
import { ReviewerTabs } from "@/scenes/Admin/reviewer/detail/ReviewerTabs";
import { ReviewerTestTarget } from "@/scenes/Admin/reviewer/detail/ReviewerTestTarget";
import { ReviewerWorkspace } from "@/scenes/Admin/reviewer/detail/ReviewerWorkspace";
import { REVIEW_CHECKLIST_VERSION } from "@/scenes/Admin/reviewer/checklist";
import { parseReviewerQueueFilters } from "@/scenes/Admin/reviewer/queue-filters";
import type { ReviewerSubmissionDetail } from "@/scenes/Admin/reviewer/types";
import {
  REVIEWER_PANELS,
  parseReviewerPanel,
} from "@/scenes/Admin/reviewer/detail/reviewer-panels";

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

  it("renders an expired claim in Pending as unassigned and available", () => {
    render(
      <ReviewerQueue
        currentUserEmail="reviewer@example.com"
        filters={parseReviewerQueueFilters({ status: "pending" })}
        hasNextPage={false}
        submissions={[
          {
            id: "review-expired",
            appId: "app_expired",
            appMetadataId: "metadata_expired",
            appName: "Expired app",
            appMode: "mini-app",
            attempt: 1,
            changelog: "Ready for another reviewer",
            claimedByEmail: "former-reviewer@example.com",
            claimExpiresAt: "2000-01-01T00:00:00.000Z",
            listingTarget: "mini_app_store",
            reviewVersion: 4,
            status: "in_review",
            submittedAt: "1999-12-31T00:00:00.000Z",
            teamId: "team_expired",
            teamName: "Expired team",
          },
        ]}
      />,
    );

    const row = screen.getByRole("row", { name: /Expired app/ });
    expect(within(row).getByText("Unassigned")).toBeInTheDocument();
    expect(
      within(row).getByText("Available — lease expired"),
    ).toBeInTheDocument();
    expect(
      within(row).queryByText("former-reviewer@example.com"),
    ).not.toBeInTheDocument();
    expect(within(row).queryByText("In review")).not.toBeInTheDocument();
  });

  it("keeps the status filter in sync after tab navigation", () => {
    const { rerender } = render(
      <ReviewerQueue
        currentUserEmail="reviewer@example.com"
        filters={parseReviewerQueueFilters({ status: "pending" })}
        hasNextPage={false}
        submissions={[]}
      />,
    );

    expect(screen.getByLabelText("Status")).toHaveValue("pending");

    rerender(
      <ReviewerQueue
        currentUserEmail="reviewer@example.com"
        filters={parseReviewerQueueFilters({ status: "approved" })}
        hasNextPage={false}
        submissions={[]}
      />,
    );

    expect(screen.getByLabelText("Status")).toHaveValue("approved");
  });
});

describe("reviewer test target", () => {
  it("shows the exact Mini App QR, copy, and open target", () => {
    render(
      <ReviewerTestTarget
        appId="app_123"
        appName="Draft app"
        metadataId="metadata_456"
        mode="mini-app"
        integrationUrl="https://mini.example.com"
      />,
    );

    const expected =
      "https://world.org/mini-app?app_id=app_123&path=&draft_id=metadata_456";
    expect(screen.getByText("Scan to test")).toBeInTheDocument();
    expect(screen.getByText("Draft app", { exact: true })).toBeInTheDocument();
    expect(
      screen.getByLabelText("World App draft QR code"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open in World App" }),
    ).toHaveAttribute("href", expected);
    expect(
      screen.getByRole("button", { name: "Copy draft link" }),
    ).toBeEnabled();
  });

  it.each([
    "http://external.example.com/integration",
    "https://reviewer:secret@external.example.com/integration",
  ])("rejects an unsafe external URL: %s", (integrationUrl) => {
    render(
      <ReviewerTestTarget
        appId="app_123"
        appName="External app"
        metadataId="metadata_456"
        mode="external"
        integrationUrl={integrationUrl}
      />,
    );

    expect(
      screen.getByText(
        "The submitted integration URL is not a valid HTTPS URL.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("World App draft QR code"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open integration" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy integration URL" }),
    ).not.toBeInTheDocument();
  });

  it("shows a validated HTTPS external URL with open and copy actions", () => {
    render(
      <ReviewerTestTarget
        appId="app_123"
        appName="External app"
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
    expect(
      screen.getByRole("button", { name: "Copy integration URL" }),
    ).toBeEnabled();
  });

  it.each([
    { compact: false, className: "min-h-[160px] min-w-[160px]" },
    { compact: true, className: "h-[88px] w-[88px]" },
  ])(
    "uses the $className QR container in compact=$compact mode",
    ({ compact, className }) => {
      render(
        <ReviewerTestTarget
          appId="app_123"
          appName="Draft app"
          metadataId="metadata_456"
          mode="mini-app"
          compact={compact}
          integrationUrl="https://mini.example.com"
        />,
      );

      expect(
        screen.getByLabelText("World App draft QR code").parentElement,
      ).toHaveClass(...className.split(" "));
    },
  );
});

describe("reviewer workspace navigation", () => {
  it.each([
    ["review", "review"],
    ["app-data", "app-data"],
    ["activity", "activity"],
    [null, "review"],
    ["overview", "review"],
  ] as const)("parses %s as %s", (value, expected) => {
    expect(parseReviewerPanel(value)).toBe(expected);
  });

  it("renders three linked tabs with roving focus", () => {
    const onChange = jest.fn();

    render(<ReviewerTabs activePanel="review" onChange={onChange} />);

    expect(REVIEWER_PANELS).toEqual(["review", "app-data", "activity"]);

    const tablist = screen.getByRole("tablist", {
      name: "Reviewer workspace sections",
    });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Review",
      "App data",
      "Activity",
    ]);
    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "id",
      "reviewer-tab-review",
    );
    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "aria-controls",
      "reviewer-panel-review",
    );
    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
      "tabindex",
      "0",
    );
    expect(screen.getByRole("tab", { name: "App data" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("wraps arrow keys and supports Home and End", () => {
    const onChange = jest.fn();

    const { rerender } = render(
      <ReviewerTabs activePanel="review" onChange={onChange} />,
    );

    const review = screen.getByRole("tab", { name: "Review" });
    const appData = screen.getByRole("tab", { name: "App data" });
    const activity = screen.getByRole("tab", { name: "Activity" });

    review.focus();
    fireEvent.keyDown(review, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("activity");
    expect(activity).toHaveFocus();

    rerender(<ReviewerTabs activePanel="activity" onChange={onChange} />);
    fireEvent.keyDown(activity, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("review");
    expect(review).toHaveFocus();

    rerender(<ReviewerTabs activePanel="review" onChange={onChange} />);
    fireEvent.keyDown(review, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("activity");
    expect(activity).toHaveFocus();

    rerender(<ReviewerTabs activePanel="activity" onChange={onChange} />);
    fireEvent.keyDown(activity, { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith("review");
    expect(review).toHaveFocus();

    fireEvent.click(appData);
    expect(onChange).toHaveBeenLastCalledWith("app-data");
  });

  it("renders the app identity, mode, attempt, status, and navigation", () => {
    render(
      <ReviewerHeader
        activePanel="review"
        appId="app_123"
        appMode="mini-app"
        appName="Draft app"
        attempt={2}
        onPanelChange={jest.fn()}
        status="in_review"
      />,
    );

    expect(screen.getByRole("heading", { name: "Draft app" })).toBeVisible();
    expect(screen.getByText("Reviewer / Mini App")).toBeVisible();
    expect(screen.getByText(/app_123.*attempt 2/i)).toBeVisible();
    expect(screen.getByLabelText("Review status")).toHaveTextContent(
      "in review",
    );
    expect(
      screen.getByRole("tablist", { name: "Reviewer workspace sections" }),
    ).toBeInTheDocument();
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

  it("allows the assigned reviewer to recover a claim in a new tab", () => {
    render(
      <ReviewClaimBar
        canReview
        claimExpiresAt="2999-01-01T00:00:00.000Z"
        claimedByEmail="reviewer@example.com"
        currentUserEmail="reviewer@example.com"
        reviewId="00000000-0000-4000-8000-000000000001"
        reviewVersion={4}
        status="in_review"
      />,
    );

    expect(
      screen.getByText(/recover the claim for this browser/i),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Recover claim" })).toBeEnabled();
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
          actorEmail: null,
          actorSubject: "mcp-api-key:key_123",
          createdAt: "2026-08-20T12:00:00.000Z",
          payload: {},
          reviewVersion: 1,
        },
        {
          id: "second",
          eventType: "claimed",
          eventSequence: 2,
          actorEmail: "reviewer@example.com",
          actorSubject: "reviewer-subject",
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
          deliveredAt: null,
          lastAttemptAt: "2026-08-21T13:05:00.000Z",
          lastError: "Provider unavailable",
          nextAttemptAt: "2026-08-21T13:06:00.000Z",
          notificationType: "decision_approved",
          providerMessageId: null,
          recipient: "owner@example.com",
          status: "failed",
          updatedAt: "2026-08-21T13:05:00.000Z",
        },
      ],
    };

    const { container } = render(<ReviewHistory {...props} />);
    const eventHeadings = Array.from(
      container.querySelectorAll("[data-review-event]"),
    ).map((node) => node.textContent);
    expect(eventHeadings[0]).toContain("Claimed");
    expect(eventHeadings[1]).toContain("Submitted");
    expect(screen.getByText(/mcp-api-key:key_123/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Retry email notification" }),
    ).toBeDisabled();

    fireEvent.click(screen.getByText("Delivery attempts"));
    expect(screen.getByText("Provider unavailable")).toBeInTheDocument();
    expect(screen.getByText(/Last attempt:/)).toBeInTheDocument();
    expect(screen.getByText(/Next retry:/)).toBeInTheDocument();
  });

  it("shows and requeues a dead-lettered submitted-asset repair", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ assetSnapshotRepair: { attemptCount: 0 } }),
    } as Response);

    render(
      <ReviewHistory
        assetSnapshotRepair={{
          ready: false,
          attemptCount: 8,
          deadLetteredAt: "2026-08-21T13:00:00.000Z",
          lastError: "Reviewer submission asset snapshot failed.",
          nextAttemptAt: null,
        }}
        canReview
        events={[]}
        notifications={[]}
        reviewId="00000000-0000-4000-8000-000000000001"
        reviewStatus="pending"
      />,
    );

    expect(screen.getByText(/stopped after 8 attempts/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Retry submitted assets" }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/reviewer/submissions/00000000-0000-4000-8000-000000000001/assets/retry",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(
      JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string),
    ).toEqual({ operationId: expect.stringMatching(/^[0-9a-f-]{36}$/i) });
    expect(window.sessionStorage).toHaveLength(0);
    expect(screen.getByText(/retry queued/i)).toBeInTheDocument();
  });

  it("reuses a notification retry operation after an ambiguous network failure", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    render(
      <ReviewHistory
        canReview
        events={[]}
        notifications={[
          {
            id: "00000000-0000-4000-8000-000000000002",
            attemptCount: 8,
            channel: "email",
            createdAt: "2026-08-21T13:00:00.000Z",
            deliveredAt: null,
            lastAttemptAt: "2026-08-21T13:05:00.000Z",
            lastError: "Provider unavailable",
            nextAttemptAt: "2026-08-21T13:10:00.000Z",
            notificationType: "decision_approved",
            providerMessageId: null,
            recipient: "owner@example.com",
            status: "dead_letter",
            updatedAt: "2026-08-21T13:05:00.000Z",
          },
        ]}
      />,
    );

    const retryButton = screen.getByRole("button", {
      name: "Retry email notification",
    });
    fireEvent.click(retryButton);
    await waitFor(() => expect(retryButton).toBeEnabled());
    expect(window.sessionStorage).toHaveLength(1);

    fireEvent.click(retryButton);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const operationIds = fetchMock.mock.calls.map(([_, init]) =>
      JSON.parse((init as RequestInit).body as string),
    );
    expect(operationIds[0]).toEqual(operationIds[1]);
    expect(operationIds[0]).toEqual({
      operationId: expect.stringMatching(/^[0-9a-f-]{36}$/i),
    });
    await waitFor(() => expect(window.sessionStorage).toHaveLength(0));
  });

  it("reuses an asset retry operation after an ambiguous server failure", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    render(
      <ReviewHistory
        assetSnapshotRepair={{
          ready: false,
          attemptCount: 8,
          deadLetteredAt: "2026-08-21T13:00:00.000Z",
          lastError: "Reviewer submission asset snapshot failed.",
          nextAttemptAt: null,
        }}
        canReview
        events={[]}
        notifications={[]}
        reviewId="00000000-0000-4000-8000-000000000001"
        reviewStatus="pending"
      />,
    );

    const retryButton = screen.getByRole("button", {
      name: "Retry submitted assets",
    });
    fireEvent.click(retryButton);
    await waitFor(() => expect(retryButton).toBeEnabled());
    expect(window.sessionStorage).toHaveLength(1);

    fireEvent.click(retryButton);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const operationIds = fetchMock.mock.calls.map(([_, init]) =>
      JSON.parse((init as RequestInit).body as string),
    );
    expect(operationIds[0]).toEqual(operationIds[1]);
    await waitFor(() => expect(window.sessionStorage).toHaveLength(0));
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
      actorSubject: "developer-subject",
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
        redirects: [],
      },
    ],
    registrations: [],
  },
};

describe("review detail workspace", () => {
  it("requires a versioned checklist snapshot before either decision", async () => {
    const claimToken = "00000000-0000-4000-8000-000000000099";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input) => {
        const path = String(input);
        if (path.endsWith("/claim")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              submission: {
                status: "in_review",
                reviewVersion: 2,
                claimToken,
                claimExpiresAt: "2999-01-01T00:00:00.000Z",
              },
            }),
          } as Response;
        }
        if (path.endsWith("/checklist")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              submission: {
                status: "in_review",
                reviewVersion: 3,
                claimToken,
                claimExpiresAt: "2999-01-01T00:00:00.000Z",
                checklistVersion: REVIEW_CHECKLIST_VERSION,
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
        submission={detailFixture}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Claim review" }));
    await screen.findByText("Claimed by you");
    fireEvent.change(screen.getByLabelText("Developer message"), {
      target: { value: "Please correct the listing metadata." },
    });
    fireEvent.change(screen.getByLabelText("Override reason"), {
      target: { value: "Policy owner approved this exception." },
    });

    expect(
      screen.getByText(/save the versioned checklist before deciding/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Request changes" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Save checklist" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Save checklist" }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/checklist"),
        expect.objectContaining({ method: "PUT" }),
      ),
    );
    expect(
      screen.getByRole("button", { name: "Request changes" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });

  it.each(["approved", "changes_requested", "withdrawn"] as const)(
    "disables the draft Test tab for a %s historical attempt",
    (status) => {
      render(
        <ReviewerWorkspace
          canReview
          currentUserEmail="reviewer@example.com"
          submission={{ ...detailFixture, status }}
        />,
      );

      expect(screen.getByRole("tab", { name: "Test" })).toBeDisabled();
      expect(
        screen.queryByText(/exact metadata version/i),
      ).not.toBeInTheDocument();
    },
  );

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

  it("rotates the assigned reviewer's token in a new tab", async () => {
    const claimedSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      status: "in_review",
      reviewVersion: 7,
      claimedByEmail: "reviewer@example.com",
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
    };
    const recoveredToken = "00000000-0000-4000-8000-000000000088";
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        submission: {
          status: "in_review",
          reviewVersion: 8,
          claimToken: recoveredToken,
          claimExpiresAt: "2999-01-01T00:30:00.000Z",
        },
      }),
    } as Response);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Recover claim" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/claim"),
        expect.objectContaining({
          body: JSON.stringify({ expectedReviewVersion: 7 }),
        }),
      ),
    );
    expect(await screen.findByText("Claimed by you")).toBeInTheDocument();
    expect(
      JSON.parse(
        window.sessionStorage.getItem(
          `admin-reviewer-claim:${detailFixture.id}`,
        ) ?? "{}",
      ),
    ).toEqual(
      expect.objectContaining({ claimToken: recoveredToken, reviewVersion: 8 }),
    );
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

  it("preserves unsaved checklist work across a server prop refresh", async () => {
    const claimToken = "00000000-0000-4000-8000-000000000099";
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
        claimToken,
        claimExpiresAt: claimedSubmission.claimExpiresAt,
        reviewVersion: 7,
      }),
    );

    const { rerender } = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );
    await screen.findByText("Claimed by you");

    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "Unsaved reviewer investigation" },
    });

    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={{
          ...claimedSubmission,
          events: [
            ...claimedSubmission.events,
            {
              id: "event-2",
              eventType: "notification_retry_queued",
              eventSequence: 2,
              actorEmail: "reviewer@example.com",
              actorSubject: "reviewer-subject",
              createdAt: "2026-08-20T13:00:00.000Z",
              payload: {},
              reviewVersion: 7,
            },
          ],
        }}
      />,
    );

    expect(screen.getByLabelText("Internal notes")).toHaveValue(
      "Unsaved reviewer investigation",
    );
    expect(
      screen.getByText(/save checklist changes before deciding/i),
    ).toBeInTheDocument();
  });

  it("keeps the five-minute heartbeat cadence across checklist saves", async () => {
    jest.useFakeTimers();
    const claimToken = "00000000-0000-4000-8000-000000000099";
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
        claimToken,
        claimExpiresAt: claimedSubmission.claimExpiresAt,
        reviewVersion: 7,
      }),
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation(async (input) => {
        const path = String(input);
        if (path.endsWith("/checklist")) {
          return {
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
          } as Response;
        }
        if (path.endsWith("/heartbeat")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              submission: {
                status: "in_review",
                reviewVersion: 9,
                claimToken,
                claimExpiresAt: "2999-01-01T00:00:00.000Z",
              },
            }),
          } as Response;
        }
        throw new Error(`Unexpected request: ${path}`);
      });

    const rendered = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );

    try {
      await act(async () => {});
      expect(screen.getByText("Claimed by you")).toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(4 * 60 * 1000);
      });
      fireEvent.change(screen.getByLabelText("Internal notes"), {
        target: { value: "Saved before the lease heartbeat" },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Save checklist" }));
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).endsWith("/checklist"),
        ),
      ).toBe(true);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(60 * 1000);
      });
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).endsWith("/heartbeat"),
        ),
      ).toBe(true);
    } finally {
      rendered.unmount();
      jest.useRealTimers();
    }
  });
});

describe("grouped reviewer checklist", () => {
  const renderChecklist = (
    overrides: Partial<ComponentProps<typeof ReviewerChecklist>> = {},
  ) => {
    const props: ComponentProps<typeof ReviewerChecklist> = {
      checklist: { items: [], internalNotes: "" },
      disabled: false,
      mode: "mini-app",
      onAddNote: jest.fn(),
      onChange: jest.fn(),
      onRetrySave: jest.fn(),
      saveState: "idle",
      version: REVIEW_CHECKLIST_VERSION,
      ...overrides,
    };
    render(<ReviewerChecklist {...props} />);
    return props;
  };

  it("renders five grouped checks with pressed status buttons and accessible progress", () => {
    renderChecklist();

    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.getByText("Listing and localization")).toBeInTheDocument();
    expect(screen.getByText("Legal and support")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Pass" })).toHaveLength(5);
    expect(screen.getAllByRole("button", { name: "Issue" })).toHaveLength(5);
    expect(screen.getAllByRole("button", { name: "N/A" })).toHaveLength(5);
    expect(screen.getAllByRole("button", { name: "Pass" })[0]).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemin",
      "0",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "5",
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("shows one contextual note for Issue or N/A and clears stale N/A notes", () => {
    const onChange = jest.fn();
    const naChecklist = {
      items: [
        {
          id: "group.listing-localization",
          status: "na" as const,
          evidence: "",
          applicabilityNote: "Not relevant",
        },
      ],
      internalNotes: "",
    };
    const { rerender } = render(
      <ReviewerChecklist
        checklist={naChecklist}
        disabled={false}
        mode="mini-app"
        onAddNote={jest.fn()}
        onChange={onChange}
        onRetrySave={jest.fn()}
        saveState="idle"
        version={REVIEW_CHECKLIST_VERSION}
      />,
    );

    expect(screen.getByLabelText(/not applicable note/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/issue note/i)).not.toBeInTheDocument();
    fireEvent.click(
      within(
        screen.getByRole("group", {
          name: "Listing and localization check status",
        }),
      ).getByRole("button", { name: "Pass" }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      items: [
        {
          id: "group.listing-localization",
          status: "pass",
          evidence: "",
        },
      ],
      internalNotes: "",
    });

    rerender(
      <ReviewerChecklist
        checklist={naChecklist}
        disabled={false}
        mode="mini-app"
        onAddNote={jest.fn()}
        onChange={onChange}
        onRetrySave={jest.fn()}
        saveState="idle"
        version={REVIEW_CHECKLIST_VERSION}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Issue" })[0]);
    expect(onChange).toHaveBeenLastCalledWith({
      items: [
        {
          id: "group.listing-localization",
          status: "fail",
          evidence: "",
        },
      ],
      internalNotes: "",
    });
    const issueChecklist = onChange.mock.calls.at(-1)?.[0];
    rerender(
      <ReviewerChecklist
        checklist={issueChecklist}
        disabled={false}
        mode="mini-app"
        onAddNote={jest.fn()}
        onChange={onChange}
        onRetrySave={jest.fn()}
        saveState="idle"
        version={REVIEW_CHECKLIST_VERSION}
      />,
    );
    expect(screen.getByLabelText(/issue note/i)).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/not applicable note/i),
    ).not.toBeInTheDocument();
  });

  it("adds only a failed issue note to the developer message", () => {
    const onAddNote = jest.fn();
    renderChecklist({
      checklist: {
        items: [
          {
            id: "group.listing-localization",
            status: "fail",
            evidence: "Correct the Spanish listing copy.",
          },
        ],
        internalNotes: "",
      },
      onAddNote,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Add note to message" }),
    );
    expect(onAddNote).toHaveBeenCalledWith("Correct the Spanish listing copy.");
  });

  it.each([
    ["saving", "Saving"],
    ["saved", "Saved"],
    ["error", "Retry save"],
  ] as const)("announces %s checklist saves", (saveState, announcement) => {
    renderChecklist({ saveState });

    expect(screen.getByRole("status")).toHaveTextContent(announcement);
    if (saveState === "error") {
      expect(screen.getByRole("button", { name: "Retry save" })).toBeEnabled();
    }
  });

  it("renders a retired checklist snapshot as read-only labels", () => {
    renderChecklist({
      definitionSnapshot: {
        mode: "mini-app",
        items: [
          {
            id: "retired.check",
            label: "Retired check label",
            description: "Preserved guidance.",
            sourceUrl: "https://example.com/guidance",
            conditional: false,
          },
        ],
      },
      version: "retired-version",
    });

    expect(screen.getByText("Retired check label")).toBeInTheDocument();
    expect(screen.getByText(/read-only/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pass" }),
    ).not.toBeInTheDocument();
  });
});
