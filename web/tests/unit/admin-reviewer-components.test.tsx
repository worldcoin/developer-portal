/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { useRef, useState } from "react";

import { ReviewerQueue } from "@/scenes/Admin/reviewer/queue/ReviewerQueue";
import { ReviewClaimBar } from "@/scenes/Admin/reviewer/detail/ReviewClaimBar";
import { ReviewHistory } from "@/scenes/Admin/reviewer/detail/ReviewHistory";
import { ReviewMetadata } from "@/scenes/Admin/reviewer/detail/ReviewMetadata";
import { ReviewOverview } from "@/scenes/Admin/reviewer/detail/ReviewOverview";
import { ReviewerHeader } from "@/scenes/Admin/reviewer/detail/ReviewerHeader";
import { ReviewerChecklist } from "@/scenes/Admin/reviewer/detail/ReviewerChecklist";
import { ReviewerTabs } from "@/scenes/Admin/reviewer/detail/ReviewerTabs";
import { ReviewerTestTarget } from "@/scenes/Admin/reviewer/detail/ReviewerTestTarget";
import {
  createChecklistDefinitionSnapshot,
  LEGACY_REVIEW_CHECKLIST_VERSION,
  REVIEW_CHECKLIST_VERSION,
} from "@/scenes/Admin/reviewer/checklist";
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

Object.defineProperty(global, "TextDecoder", {
  configurable: true,
  value: TextDecoder,
});

const {
  renderToString,
}: typeof import("react-dom/server") = require("react-dom/server.node");

const {
  ReviewerWorkspace,
}: typeof import("@/scenes/Admin/reviewer/detail/ReviewerWorkspace") = require("@/scenes/Admin/reviewer/detail/ReviewerWorkspace");
const {
  appendReviewerNote,
  ReviewerDecisionComposer,
}: typeof import("@/scenes/Admin/reviewer/detail/ReviewerDecisionComposer") = require("@/scenes/Admin/reviewer/detail/ReviewerDecisionComposer");
const {
  ReviewerDecisionConfirmation,
}: typeof import("@/scenes/Admin/reviewer/detail/ReviewerDecisionConfirmation") = require("@/scenes/Admin/reviewer/detail/ReviewerDecisionConfirmation");
const {
  ReviewerActionRail,
}: typeof import("@/scenes/Admin/reviewer/detail/ReviewerActionRail") = require("@/scenes/Admin/reviewer/detail/ReviewerActionRail");

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
const mockReplace = jest.fn();
let mockPathname = "/admin/reviewer/00000000-0000-4000-8000-000000000001";
let mockSearchParams = "";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ refresh: mockRefresh, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(mockSearchParams),
}));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

beforeEach(() => {
  jest.restoreAllMocks();
  mockRefresh.mockClear();
  mockReplace.mockClear();
  mockPathname = "/admin/reviewer/00000000-0000-4000-8000-000000000001";
  mockSearchParams = "";
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

  it("reduces the compact Mini App target to identity, QR, and primary action", () => {
    const { container } = render(
      <ReviewerTestTarget
        appId="app_123"
        appName="Draft app"
        compact
        metadataId="metadata_456"
        mode="mini-app"
        integrationUrl="https://mini.example.com"
      />,
    );

    expect(screen.getByText("Scan to test")).toBeInTheDocument();
    expect(screen.getByText("Draft app", { exact: true })).toBeInTheDocument();
    expect(
      screen.getByLabelText("World App draft QR code").parentElement,
    ).toHaveClass("h-[88px]", "w-[88px]");
    expect(
      screen.getByRole("link", { name: "Open in World App" }),
    ).toHaveAttribute(
      "href",
      "https://world.org/mini-app?app_id=app_123&path=&draft_id=metadata_456",
    );
    expect(
      screen.queryByText("Test the exact metadata version"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("code")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy draft link" }),
    ).not.toBeInTheDocument();
  });

  it("reduces the compact external target to identity and primary action", () => {
    const { container } = render(
      <ReviewerTestTarget
        appId="app_123"
        appName="External app"
        compact
        metadataId="metadata_456"
        mode="external"
        integrationUrl="https://external.example.com/integration"
      />,
    );

    expect(screen.getByText("External integration")).toBeInTheDocument();
    expect(
      screen.getByText("External app", { exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open integration" }),
    ).toHaveAttribute("href", "https://external.example.com/integration");
    expect(
      screen.queryByText("Test in a standard browser"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("code")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Copy integration URL" }),
    ).not.toBeInTheDocument();
  });
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

  it("makes a claim available after its lease expires without a parent rerender", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-31T12:00:00.000Z"));

    try {
      render(
        <ReviewClaimBar
          canReview
          claimExpiresAt="2026-08-31T12:00:30.000Z"
          claimedByEmail="former-reviewer@example.com"
          currentUserEmail="reviewer@example.com"
          reviewId="00000000-0000-4000-8000-000000000001"
          reviewVersion={4}
          status="in_review"
        />,
      );

      expect(
        screen.getByRole("button", { name: "Claim review" }),
      ).toBeDisabled();

      act(() => {
        jest.advanceTimersByTime(30_000);
      });

      expect(
        screen.getByText(/lease expired, available to claim/i),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Claim review" }),
      ).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
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

const groupedChecklistItems = [
  "group.listing-localization",
  "group.experience-test",
  "group.integration-reliability",
  "group.permissions-safety",
  "group.legal-support",
].map((id) => ({ id, status: "pass" as const, evidence: "" }));

const claimedSubmissionFixture = (
  overrides: Partial<ReviewerSubmissionDetail> = {},
): ReviewerSubmissionDetail => ({
  ...detailFixture,
  checklist: {
    items: groupedChecklistItems,
    internalNotes: "",
    definitionSnapshot: createChecklistDefinitionSnapshot(
      "mini-app",
      REVIEW_CHECKLIST_VERSION,
    )!,
  },
  checklistVersion: REVIEW_CHECKLIST_VERSION,
  status: "in_review",
  reviewVersion: 7,
  claimedByEmail: "reviewer@example.com",
  claimExpiresAt: "2999-01-01T00:00:00.000Z",
  ...overrides,
});

const seedClaimSession = (
  submission: ReviewerSubmissionDetail,
  claimToken = "00000000-0000-4000-8000-000000000099",
) => {
  window.sessionStorage.setItem(
    `admin-reviewer-claim:${submission.id}`,
    JSON.stringify({
      claimToken,
      claimExpiresAt: submission.claimExpiresAt,
      reviewVersion: submission.reviewVersion,
    }),
  );
  return claimToken;
};

describe("review detail workspace", () => {
  it("renders only the three URL-backed tabs and restores the active panel", async () => {
    const { rerender } = render(
      <ReviewerWorkspace
        canReview={false}
        currentUserEmail="reader@example.com"
        submission={detailFixture}
      />,
    );

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "Review",
      "App data",
      "Activity",
    ]);
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "reviewer-panel-review",
    );
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "aria-labelledby",
      "reviewer-tab-review",
    );

    fireEvent.click(screen.getByRole("tab", { name: "App data" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      `${mockPathname}?panel=app-data`,
      { scroll: false },
    );

    mockSearchParams = "view=compact&panel=activity";
    rerender(
      <ReviewerWorkspace
        canReview={false}
        currentUserEmail="reader@example.com"
        submission={detailFixture}
      />,
    );
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    expect(screen.getByRole("tabpanel")).toHaveAttribute(
      "id",
      "reviewer-panel-activity",
    );

    fireEvent.click(screen.getByRole("tab", { name: "Review" }));
    expect(mockReplace).toHaveBeenLastCalledWith(
      `${mockPathname}?view=compact`,
      { scroll: false },
    );
  });

  it("mounts only the active task panel while keeping the exact test target", async () => {
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

    expect(screen.getByText("Developer submission note")).toBeInTheDocument();
    expect(screen.getByText("Draft vs live changes")).toBeInTheDocument();
    expect(screen.getByText("Review checklist")).toBeInTheDocument();
    expect(screen.getByText("Listing and localization")).toBeInTheDocument();
    expect(
      screen.queryByText("Canonical submitted metadata"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Immutable review timeline"),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByLabelText("World App draft QR code").length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("tab", { name: "App data" }));
    expect(
      screen.getByText("Canonical submitted metadata"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Developer submission note"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Immutable review timeline"),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByLabelText("World App draft QR code").length,
    ).toBeGreaterThan(0);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByText("Immutable review timeline")).toBeInTheDocument();
    expect(
      screen.queryByText("Canonical submitted metadata"),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByLabelText("World App draft QR code").length,
    ).toBeGreaterThan(0);
  });

  it("keeps the exact test target in both outcome confirmations without sending early", async () => {
    const submission = claimedSubmissionFixture();
    seedClaimSession(submission);
    const fetchMock = jest.spyOn(global, "fetch");

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      within(screen.getByRole("dialog")).getByLabelText(
        "World App draft QR code",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    fireEvent.change(screen.getByLabelText("Message to developer"), {
      target: { value: "Please correct the localized listing." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      within(screen.getByRole("dialog")).getByLabelText(
        "World App draft QR code",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm request changes" }),
    ).toBeEnabled();
  });

  it("keeps a safe external target visible without rendering a World App QR", () => {
    render(
      <ReviewerWorkspace
        canReview={false}
        currentUserEmail="reader@example.com"
        submission={{
          ...detailFixture,
          appMode: "external",
          listingTarget: "world_ecosystem",
          metadataSnapshot: {
            ...detailFixture.metadataSnapshot,
            integration_url: "https://external.example.com/integration",
          },
        }}
      />,
    );

    expect(
      screen.queryByLabelText("World App draft QR code"),
    ).not.toBeInTheDocument();
    for (const link of screen.getAllByRole("link", {
      name: "Open integration",
    })) {
      expect(link).toHaveAttribute(
        "href",
        "https://external.example.com/integration",
      );
    }
  });

  it("uses the responsive two-pane layout with a bounded rail and mobile dock space", () => {
    const submission = claimedSubmissionFixture();
    seedClaimSession(submission);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );

    expect(screen.getByTestId("reviewer-workspace-body")).toHaveClass(
      "min-w-0",
      "pb-24",
      "lg:grid-cols-[minmax(0,1fr)_360px]",
    );
    expect(screen.getByTestId("reviewer-desktop-action-rail")).toHaveClass(
      "lg:max-h-[calc(100dvh-2rem)]",
      "lg:overflow-y-auto",
    );
    expect(screen.getByTestId("reviewer-mobile-test-target")).toHaveClass(
      "sticky",
      "top-0",
    );
    expect(
      screen.getByRole("button", { name: "Message and decide" }),
    ).toBeInTheDocument();
  });

  it("keeps the test target and review controls reachable in the mobile composer", async () => {
    const submission = claimedSubmissionFixture();
    seedClaimSession(submission);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");

    fireEvent.click(screen.getByRole("button", { name: "Message and decide" }));

    const composer = screen.getByRole("dialog", {
      name: "Message and decide",
    });
    expect(
      within(composer).getByLabelText("World App draft QR code"),
    ).toBeInTheDocument();
    expect(within(composer).getByText("Claimed by you")).toBeInTheDocument();
    expect(within(composer).getByLabelText("Internal notes")).toBeEnabled();
    expect(
      within(composer).getByLabelText("Message to developer"),
    ).toBeEnabled();
    expect(
      document.querySelectorAll("#reviewer-developer-message"),
    ).toHaveLength(1);
  });

  it("sends the unchanged decision payload only after final confirmation and clears local state on success", async () => {
    const claimToken = "00000000-0000-4000-8000-000000000099";
    const submission = claimedSubmissionFixture({
      checklist: {
        items: groupedChecklistItems.map((item, index) =>
          index === 0
            ? { ...item, status: "fail" as const, evidence: "Fix listing" }
            : item,
        ),
        internalNotes: "",
        definitionSnapshot: createChecklistDefinitionSnapshot(
          "mini-app",
          REVIEW_CHECKLIST_VERSION,
        )!,
      },
    });
    seedClaimSession(submission, claimToken);
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          submission: {
            status: "in_review",
            reviewVersion: 8,
            claimToken,
            claimExpiresAt: submission.claimExpiresAt,
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          submission: {
            status: "changes_requested",
            reviewVersion: 9,
            claimToken: null,
            claimExpiresAt: null,
          },
        }),
      } as Response);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");

    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "Reviewed the submitted flow." },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await screen.findAllByText(/saved/i);
    fireEvent.change(screen.getByLabelText("Message to developer"), {
      target: { value: "Please correct the localized listing." },
    });
    fireEvent.change(screen.getByLabelText("Override reason"), {
      target: { value: "Policy owner reviewed the remaining exception." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm request changes" }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/admin/reviewer/submissions/${submission.id}/decision`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          claimToken,
          expectedReviewVersion: 8,
          appMetadataId: submission.appMetadataId,
          expectedMetadataUpdatedAt: submission.metadataUpdatedAt,
          decision: "changes_requested",
          developerMessage: "Please correct the localized listing.",
          overrideReason: "Policy owner reviewed the remaining exception.",
        }),
      }),
    );
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Message to developer")).toHaveValue("");
    expect(screen.getByLabelText("Override reason")).toHaveValue("");
    expect(
      screen.queryByText("Checklist changes saved."),
    ).not.toBeInTheDocument();
    expect(
      window.sessionStorage.getItem(`admin-reviewer-claim:${submission.id}`),
    ).toBeNull();
  });

  it("waits for a deferred checklist save and decides with its new workflow version", async () => {
    const submission = claimedSubmissionFixture();
    const claimToken = seedClaimSession(submission);
    let resolveChecklist!: (response: Response) => void;
    const checklistResponse = new Promise<Response>((resolve) => {
      resolveChecklist = resolve;
    });
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(checklistResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          submission: {
            status: "changes_requested",
            reviewVersion: 9,
            claimToken: null,
            claimExpiresAt: null,
          },
        }),
      } as Response);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent.change(screen.getByLabelText("Message to developer"), {
      target: { value: "Please retry the checkout flow." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "Final note queued before confirmation." },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm request changes" }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveChecklist({
      ok: true,
      status: 200,
      json: async () => ({
        submission: {
          status: "in_review",
          reviewVersion: 8,
          claimToken,
          claimExpiresAt: submission.claimExpiresAt,
        },
      }),
    } as Response);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string),
    ).toEqual({
      claimToken,
      expectedReviewVersion: 8,
      appMetadataId: submission.appMetadataId,
      expectedMetadataUpdatedAt: submission.metadataUpdatedAt,
      decision: "changes_requested",
      developerMessage: "Please retry the checkout flow.",
    });
  });

  it("shows a safe structured client error and preserves confirmation inputs", async () => {
    const submission = claimedSubmissionFixture();
    seedClaimSession(submission);
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        code: "INVALID_REVIEW_STATE",
        error: "The submitted metadata changed. Refresh before retrying.",
      }),
    } as Response);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent.change(screen.getByLabelText("Message to developer"), {
      target: { value: "Keep this feedback for retry." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Confirm request changes" }),
    );

    const confirmation = screen.getByRole("dialog", {
      name: "Confirm request changes",
    });
    expect(
      await within(confirmation).findByText(
        "The submitted metadata changed. Refresh before retrying.",
      ),
    ).toHaveAttribute("role", "alert");
    const retry = within(confirmation).getByRole("button", {
      name: "Confirm request changes",
    });
    expect(retry).toBeEnabled();
    fireEvent.click(retry);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText("Message to developer")).toHaveValue(
      "Keep this feedback for retry.",
    );
  });

  it("shows decision busy state inside confirmation", async () => {
    const submission = claimedSubmissionFixture();
    seedClaimSession(submission);
    let resolveDecision!: (response: Response) => void;
    jest.spyOn(global, "fetch").mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveDecision = resolve;
      }),
    );

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    const confirmation = screen.getByRole("dialog", {
      name: "Confirm approval",
    });
    fireEvent.click(
      within(confirmation).getByRole("button", { name: "Confirm approval" }),
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(confirmation).toHaveAttribute("aria-busy", "true");
    expect(
      within(confirmation).getByRole("button", { name: "Confirm approval" }),
    ).toBeDisabled();

    resolveDecision({
      ok: true,
      status: 200,
      json: async () => ({
        submission: {
          status: "approved",
          reviewVersion: 8,
          claimToken: null,
          claimExpiresAt: null,
        },
      }),
    } as Response);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it.each([
    {
      name: "invalid 400 JSON",
      response: {
        ok: false,
        status: 400,
        json: async () => {
          throw new SyntaxError("invalid JSON");
        },
      } as unknown as Response,
      expected:
        "The review action was rejected (400). Check the request and try again.",
    },
    {
      name: "a 500-series response",
      response: {
        ok: false,
        status: 503,
        json: async () => ({ error: "Unsafe internal detail" }),
      } as Response,
      expected: "The review service is unavailable (503). Try again.",
    },
  ])("uses the status fallback for $name", async ({ response, expected }) => {
    const submission = claimedSubmissionFixture();
    seedClaimSession(submission);
    jest.spyOn(global, "fetch").mockResolvedValue(response);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm approval" }));

    const confirmation = screen.getByRole("dialog", {
      name: "Confirm approval",
    });
    expect(await within(confirmation).findByText(expected)).toHaveAttribute(
      "role",
      "alert",
    );
  });

  it("uses a network fallback without closing confirmation", async () => {
    const submission = claimedSubmissionFixture();
    seedClaimSession(submission);
    jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("offline"));

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm approval" }));

    const confirmation = screen.getByRole("dialog", {
      name: "Confirm approval",
    });
    expect(
      await within(confirmation).findByText(
        "The review action could not reach the server. Check your connection and try again.",
      ),
    ).toHaveAttribute("role", "alert");
  });

  it("closes confirmation and requires reclaim after a decision conflict", async () => {
    const submission = claimedSubmissionFixture();
    seedClaimSession(submission);
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        code: "REVIEW_CONFLICT",
        error: "Review workflow conflict",
      }),
    } as Response);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm approval" }));

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recover claim" })).toBeEnabled();
    expect(
      window.sessionStorage.getItem(`admin-reviewer-claim:${submission.id}`),
    ).toBeNull();
  });

  it("clears composer, confirmation, and URL panel state when the submission changes", async () => {
    mockSearchParams = "panel=activity&view=compact";
    const firstSubmission = claimedSubmissionFixture({
      checklist: {
        items: groupedChecklistItems.slice(0, 4),
        internalNotes: "",
        definitionSnapshot: createChecklistDefinitionSnapshot(
          "mini-app",
          REVIEW_CHECKLIST_VERSION,
        )!,
      },
    });
    seedClaimSession(firstSubmission);
    const secondSubmission = claimedSubmissionFixture({
      id: "00000000-0000-4000-8000-000000000002",
      appName: "Second draft app",
      claimedByEmail: null,
      claimExpiresAt: null,
      status: "pending",
      reviewVersion: 1,
    });

    const { rerender } = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={firstSubmission}
      />,
    );
    await screen.findByText("Claimed by you");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const firstMessageField = screen.getByLabelText("Message to developer");
    fireEvent.change(firstMessageField, {
      target: { value: "Submission-specific feedback." },
    });
    fireEvent.change(screen.getByLabelText("Override reason"), {
      target: { value: "Submission-specific override." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request changes" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    mockPathname = "/admin/reviewer/00000000-0000-4000-8000-000000000002";
    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={secondSubmission}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Review" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const secondMessageField = screen.getByLabelText("Message to developer");
    expect(secondMessageField).not.toBe(firstMessageField);
    expect(secondMessageField).toHaveValue("");
    expect(screen.queryByLabelText("Override reason")).not.toBeInTheDocument();
    expect(screen.getByText("Developer submission note")).toBeInTheDocument();
    expect(mockReplace).toHaveBeenLastCalledWith(
      `${mockPathname}?view=compact`,
      { scroll: false },
    );
  });

  it("serializes rapid checklist autosaves with the latest workflow version", async () => {
    const claimToken = "00000000-0000-4000-8000-000000000099";
    const claimedSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      checklist: {
        ...detailFixture.checklist,
        definitionSnapshot: { mode: "mini-app", items: [] },
      },
      checklistVersion: REVIEW_CHECKLIST_VERSION,
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

    let resolveFirst!: (response: Response) => void;
    let resolveSecond!: (response: Response) => void;
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const secondResponse = new Promise<Response>((resolve) => {
      resolveSecond = resolve;
    });
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(firstResponse)
      .mockReturnValueOnce(secondResponse);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent.change(screen.getByLabelText("Message to developer"), {
      target: { value: "Please correct this." },
    });
    expect(
      screen.getByRole("button", { name: "Request changes" }),
    ).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "first edit" },
    });
    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "newest edit" },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("button", { name: "Request changes" }),
    ).toBeDisabled();
    expect(
      JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string),
    ).toEqual({
      checklist: { internalNotes: "first edit", items: [] },
      checklistVersion: REVIEW_CHECKLIST_VERSION,
      claimToken,
      expectedReviewVersion: 7,
    });

    resolveFirst({
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

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(
      JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string),
    ).toEqual({
      checklist: { internalNotes: "newest edit", items: [] },
      checklistVersion: REVIEW_CHECKLIST_VERSION,
      claimToken,
      expectedReviewVersion: 8,
    });

    resolveSecond({
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
    } as Response);
    await waitFor(() =>
      expect(
        screen.queryByText("Saving checklist changes."),
      ).not.toBeInTheDocument(),
    );
  });

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
    fireEvent.change(screen.getByLabelText("Message to developer"), {
      target: { value: "Please correct the listing metadata." },
    });
    fireEvent.change(screen.getByLabelText("Override reason"), {
      target: { value: "Policy owner approved this exception." },
    });

    expect(
      screen.getAllByText(/save the versioned checklist before deciding/i)
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Request changes" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Save checklist" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "Reviewed before deciding." },
    });
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
    "keeps the immutable test target and three panels for a %s historical attempt",
    (status) => {
      render(
        <ReviewerWorkspace
          canReview
          currentUserEmail="reviewer@example.com"
          submission={{ ...detailFixture, status }}
        />,
      );

      expect(screen.getAllByRole("tab")).toHaveLength(3);
      expect(
        screen.getAllByLabelText("World App draft QR code").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText(/exact metadata version/i).length,
      ).toBeGreaterThan(0);
    },
  );

  it("requests fresh signed assets only when the App data tab is opened", async () => {
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
    fireEvent.click(screen.getByRole("tab", { name: "App data" }));
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

    render(
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

    fireEvent.click(screen.getByRole("tab", { name: "App data" }));
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

    fireEvent.click(screen.getByRole("tab", { name: "Review" }));
    const firstGroup = screen
      .getByRole("heading", { name: "Listing and localization" })
      .closest("article")!;
    fireEvent.click(within(firstGroup).getByRole("button", { name: "N/A" }));
    const applicabilityNote = screen.getByLabelText(
      "Listing and localization not applicable note",
    );
    expect(applicabilityNote).toBeInTheDocument();
    fireEvent.change(applicabilityNote, {
      target: { value: "No user-facing metadata applies to this test." },
    });

    const approve = screen.getByRole("button", { name: "Approve" });
    expect(approve).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Override reason"), {
      target: { value: "Partner exception approved by policy owner." },
    });
    expect(approve).toBeDisabled();

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/checklist"),
        expect.objectContaining({ method: "PUT" }),
      ),
    );
    expect(approve).toBeEnabled();

    fireEvent.click(screen.getByRole("tab", { name: "Activity" }));
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText(/claimed by you/i)).toBeInTheDocument();

    const rail = screen.getByTestId("reviewer-desktop-action-rail");
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

  it("preserves an active checklist autosave across a server prop refresh", async () => {
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
    jest.spyOn(global, "fetch").mockReturnValue(new Promise(() => undefined));

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
      screen.getAllByText(/saving checklist changes/i).length,
    ).toBeGreaterThan(0);
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
      await act(async () => {
        fireEvent.change(screen.getByLabelText("Internal notes"), {
          target: { value: "Saved before the lease heartbeat" },
        });
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

  it("keeps heartbeat writes behind an active checklist autosave", async () => {
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

    let resolveChecklist!: (response: Response) => void;
    const checklistResponse = new Promise<Response>((resolve) => {
      resolveChecklist = resolve;
    });
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(checklistResponse)
      .mockResolvedValueOnce({
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
      } as Response);

    render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );
    await screen.findByText("Claimed by you");

    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "save in flight" },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent(document, new Event("visibilitychange"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveChecklist({
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
      expect(
        screen.queryByText("Saving checklist changes."),
      ).not.toBeInTheDocument(),
    );

    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/heartbeat"),
      expect.objectContaining({
        body: JSON.stringify({
          claimToken,
          expectedReviewVersion: 8,
        }),
      }),
    );
  });

  it("waits for heartbeat before reading the current checklist workflow context", async () => {
    const claimToken = "00000000-0000-4000-8000-000000000099";
    const claimedSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      checklistVersion: LEGACY_REVIEW_CHECKLIST_VERSION,
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

    let resolveHeartbeat!: (response: Response) => void;
    const heartbeatResponse = new Promise<Response>((resolve) => {
      resolveHeartbeat = resolve;
    });
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(heartbeatResponse)
      .mockResolvedValueOnce({
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
      } as Response);

    const { rerender } = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={claimedSubmission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "queued behind heartbeat" },
    });
    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={{
          ...claimedSubmission,
          checklistVersion: REVIEW_CHECKLIST_VERSION,
        }}
      />,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveHeartbeat({
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

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[1][0])).toContain("/checklist");
    expect(
      JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string),
    ).toEqual({
      checklist: {
        internalNotes: "queued behind heartbeat",
        items: [],
      },
      checklistVersion: REVIEW_CHECKLIST_VERSION,
      claimToken,
      expectedReviewVersion: 8,
    });
  });

  it("lets a new submission save without waiting for the previous heartbeat", async () => {
    const claimTokenA = "00000000-0000-4000-8000-000000000099";
    const claimTokenB = "00000000-0000-4000-8000-000000000088";
    const submissionA: ReviewerSubmissionDetail = {
      ...detailFixture,
      status: "in_review",
      reviewVersion: 7,
      claimedByEmail: "reviewer@example.com",
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
    };
    const submissionB: ReviewerSubmissionDetail = {
      ...submissionA,
      id: "00000000-0000-4000-8000-000000000002",
      reviewVersion: 20,
    };
    window.sessionStorage.setItem(
      `admin-reviewer-claim:${submissionA.id}`,
      JSON.stringify({
        claimToken: claimTokenA,
        claimExpiresAt: submissionA.claimExpiresAt,
        reviewVersion: 7,
      }),
    );
    window.sessionStorage.setItem(
      `admin-reviewer-claim:${submissionB.id}`,
      JSON.stringify({
        claimToken: claimTokenB,
        claimExpiresAt: submissionB.claimExpiresAt,
        reviewVersion: 20,
      }),
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    let resolveHeartbeat!: (response: Response) => void;
    const heartbeatResponse = new Promise<Response>((resolve) => {
      resolveHeartbeat = resolve;
    });
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(heartbeatResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          submission: {
            status: "in_review",
            reviewVersion: 21,
            claimToken: claimTokenB,
            claimExpiresAt: "2999-01-01T00:00:00.000Z",
          },
        }),
      } as Response);

    const { rerender } = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submissionA}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={submissionB}
      />,
    );
    await act(async () => {});
    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "submission B edit" },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      `/submissions/${submissionB.id}/checklist`,
    );
    expect(
      JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string),
    ).toEqual({
      checklist: { internalNotes: "submission B edit", items: [] },
      checklistVersion: REVIEW_CHECKLIST_VERSION,
      claimToken: claimTokenB,
      expectedReviewVersion: 20,
    });
    expect(
      JSON.parse(
        window.sessionStorage.getItem(
          `admin-reviewer-claim:${submissionB.id}`,
        )!,
      ),
    ).toEqual({
      claimToken: claimTokenB,
      claimExpiresAt: submissionB.claimExpiresAt,
      reviewVersion: 21,
    });

    const staleHeartbeatJson = jest.fn().mockResolvedValue({
      submission: {
        status: "in_review",
        reviewVersion: 8,
        claimToken: claimTokenA,
        claimExpiresAt: "2999-01-01T00:00:00.000Z",
      },
    });
    resolveHeartbeat({
      ok: true,
      status: 200,
      json: staleHeartbeatJson,
    } as unknown as Response);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(staleHeartbeatJson).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Review status")).toHaveTextContent(
      "in review",
    );
  });

  it("ignores an original heartbeat after switching away and back", async () => {
    const originalClaimToken = "00000000-0000-4000-8000-000000000077";
    const currentClaimToken = "00000000-0000-4000-8000-000000000066";
    const originalSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      status: "in_review",
      reviewVersion: 7,
      claimedByEmail: "reviewer@example.com",
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
    };
    const otherSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      id: "00000000-0000-4000-8000-000000000002",
    };
    const currentSubmission: ReviewerSubmissionDetail = {
      ...originalSubmission,
      reviewVersion: 30,
    };
    window.sessionStorage.setItem(
      `admin-reviewer-claim:${originalSubmission.id}`,
      JSON.stringify({
        claimToken: originalClaimToken,
        claimExpiresAt: originalSubmission.claimExpiresAt,
        reviewVersion: 7,
      }),
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    let resolveHeartbeat!: (response: Response) => void;
    const heartbeatResponse = new Promise<Response>((resolve) => {
      resolveHeartbeat = resolve;
    });
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockReturnValueOnce(heartbeatResponse)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          submission: {
            status: "in_review",
            reviewVersion: 31,
            claimToken: currentClaimToken,
            claimExpiresAt: "2999-01-01T00:00:00.000Z",
          },
        }),
      } as Response);

    const { rerender } = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={originalSubmission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={otherSubmission}
      />,
    );
    await act(async () => {});
    window.sessionStorage.setItem(
      `admin-reviewer-claim:${currentSubmission.id}`,
      JSON.stringify({
        claimToken: currentClaimToken,
        claimExpiresAt: currentSubmission.claimExpiresAt,
        reviewVersion: 30,
      }),
    );
    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={currentSubmission}
      />,
    );
    await act(async () => {});
    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "new A generation edit" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const staleHeartbeatJson = jest.fn().mockResolvedValue({
      submission: {
        status: "in_review",
        reviewVersion: 8,
        claimToken: originalClaimToken,
        claimExpiresAt: "2999-01-01T00:00:00.000Z",
      },
    });
    resolveHeartbeat({
      ok: true,
      status: 200,
      json: staleHeartbeatJson,
    } as unknown as Response);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(staleHeartbeatJson).not.toHaveBeenCalled();
    expect(String(fetchMock.mock.calls[1][0])).toContain(
      `/submissions/${currentSubmission.id}/checklist`,
    );
    expect(
      JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string),
    ).toEqual({
      checklist: { internalNotes: "new A generation edit", items: [] },
      checklistVersion: REVIEW_CHECKLIST_VERSION,
      claimToken: currentClaimToken,
      expectedReviewVersion: 30,
    });
    expect(
      JSON.parse(
        window.sessionStorage.getItem(
          `admin-reviewer-claim:${currentSubmission.id}`,
        )!,
      ),
    ).toEqual({
      claimToken: currentClaimToken,
      claimExpiresAt: currentSubmission.claimExpiresAt,
      reviewVersion: 31,
    });
  });

  it("ignores an autosave response after switching submissions", async () => {
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

    let resolveChecklist!: (response: Response) => void;
    const fetchMock = jest.spyOn(global, "fetch").mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveChecklist = resolve;
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
      target: { value: "old submission edit" },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const nextSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      id: "00000000-0000-4000-8000-000000000002",
      checklist: { internalNotes: "new submission", items: [] },
    };
    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={nextSubmission}
      />,
    );
    expect(screen.getByLabelText("Internal notes")).toHaveValue(
      "new submission",
    );

    resolveChecklist({
      ok: true,
      status: 200,
      json: async () => ({
        submission: {
          status: "approved",
          reviewVersion: 99,
          claimToken: null,
          claimExpiresAt: null,
        },
      }),
    } as Response);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.queryByText("approved")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Internal notes")).toHaveValue(
      "new submission",
    );
  });

  it("ignores an original autosave after switching away and back", async () => {
    const originalClaimToken = "00000000-0000-4000-8000-000000000077";
    const currentClaimToken = "00000000-0000-4000-8000-000000000066";
    const originalSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      status: "in_review",
      reviewVersion: 7,
      claimedByEmail: "reviewer@example.com",
      claimExpiresAt: "2999-01-01T00:00:00.000Z",
    };
    const otherSubmission: ReviewerSubmissionDetail = {
      ...detailFixture,
      id: "00000000-0000-4000-8000-000000000002",
    };
    const currentSubmission: ReviewerSubmissionDetail = {
      ...originalSubmission,
      reviewVersion: 30,
    };
    seedClaimSession(originalSubmission, originalClaimToken);

    let resolveChecklist!: (response: Response) => void;
    const staleChecklistJson = jest.fn().mockResolvedValue({
      submission: {
        status: "approved",
        reviewVersion: 8,
        claimToken: originalClaimToken,
        claimExpiresAt: originalSubmission.claimExpiresAt,
      },
    });
    jest.spyOn(global, "fetch").mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveChecklist = resolve;
      }),
    );

    const { rerender } = render(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={originalSubmission}
      />,
    );
    await screen.findByText("Claimed by you");
    fireEvent.change(screen.getByLabelText("Internal notes"), {
      target: { value: "original A edit" },
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={otherSubmission}
      />,
    );
    seedClaimSession(currentSubmission, currentClaimToken);
    rerender(
      <ReviewerWorkspace
        canReview
        currentUserEmail="reviewer@example.com"
        submission={currentSubmission}
      />,
    );
    await screen.findByText("Claimed by you");

    resolveChecklist({
      ok: true,
      status: 200,
      json: staleChecklistJson,
    } as unknown as Response);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(staleChecklistJson).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Review status")).toHaveTextContent(
      "in review",
    );
    expect(
      JSON.parse(
        window.sessionStorage.getItem(
          `admin-reviewer-claim:${currentSubmission.id}`,
        )!,
      ),
    ).toEqual({
      claimToken: currentClaimToken,
      claimExpiresAt: currentSubmission.claimExpiresAt,
      reviewVersion: 30,
    });
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

  it("keeps persisted legacy checklist controls available", () => {
    renderChecklist({ version: LEGACY_REVIEW_CHECKLIST_VERSION });

    expect(screen.getByText("Review guidelines")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Accurate metadata check status"),
    ).toBeEnabled();
  });

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

describe("reviewer decision composer", () => {
  const testTarget = {
    appId: "app_123",
    appName: "Draft app",
    integrationUrl: "https://mini.example.com",
    metadataId: "metadata_456",
    mode: "mini-app" as const,
  };

  const renderComposer = (
    overrides: Partial<ComponentProps<typeof ReviewerDecisionComposer>> = {},
  ) => {
    const props: ComponentProps<typeof ReviewerDecisionComposer> = {
      developerMessage: "",
      onDeveloperMessageChange: jest.fn(),
      onOverrideReasonChange: jest.fn(),
      onSelectOutcome: jest.fn(),
      overrideReason: "",
      saveState: "idle",
      ...overrides,
    };
    render(<ReviewerDecisionComposer {...props} />);
    return props;
  };

  it("caps the developer message at the shared limit", () => {
    const onDeveloperMessageChange = jest.fn();
    renderComposer({ onDeveloperMessageChange });

    expect(screen.getByLabelText("Message to developer")).toHaveAttribute(
      "maxLength",
      "20000",
    );
    fireEvent.change(screen.getByLabelText("Message to developer"), {
      target: { value: "Please update the sign in flow." },
    });
    expect(onDeveloperMessageChange).toHaveBeenCalledWith(
      "Please update the sign in flow.",
    );
  });

  it("requires a message only before requesting changes", () => {
    const props = renderComposer();

    const requestChanges = screen.getByRole("button", {
      name: "Request changes",
    });
    const approve = screen.getByRole("button", { name: "Approve" });
    expect(requestChanges).toBeDisabled();
    expect(approve).toBeEnabled();
    expect(requestChanges).toHaveAccessibleDescription(
      "A message to the developer is required to request changes.",
    );

    fireEvent.click(approve);
    expect(props.onSelectOutcome).toHaveBeenCalledWith("approved");
  });

  it("only reveals the override control for blocked approval", () => {
    const { rerender } = render(
      <ReviewerDecisionComposer
        developerMessage=""
        onDeveloperMessageChange={jest.fn()}
        onOverrideReasonChange={jest.fn()}
        onSelectOutcome={jest.fn()}
        overrideReason=""
        saveState="idle"
      />,
    );
    expect(
      screen.queryByText("Override blocked approval"),
    ).not.toBeInTheDocument();

    rerender(
      <ReviewerDecisionComposer
        blockedApprovalReason="One checklist check failed."
        developerMessage=""
        onDeveloperMessageChange={jest.fn()}
        onOverrideReasonChange={jest.fn()}
        onSelectOutcome={jest.fn()}
        overrideReason=""
        saveState="idle"
      />,
    );

    expect(screen.getByText("Override blocked approval")).toBeInTheDocument();
    expect(screen.getByLabelText("Override reason")).toBeInTheDocument();
  });

  it("requires a nonblank override before blocked approval opens confirmation", () => {
    const props = renderComposer({
      blockedApprovalReason: "One checklist check failed.",
    });

    const approve = screen.getByRole("button", { name: "Approve" });
    expect(approve).toBeDisabled();
    expect(approve).toHaveAccessibleDescription(
      "Enter an override reason before approving despite blocked checks.",
    );

    fireEvent.change(screen.getByLabelText("Override reason"), {
      target: { value: "  Reviewed exception  " },
    });
    expect(props.onOverrideReasonChange).toHaveBeenCalledWith(
      "  Reviewed exception  ",
    );
  });

  it("appends only a nonblank reviewer note", () => {
    expect(
      appendReviewerNote("Existing message\n", "  Fix the checkout copy. "),
    ).toBe("Existing message\n\nFix the checkout copy.");
    expect(appendReviewerNote("Existing message", "  ")).toBe(
      "Existing message",
    );
  });

  it("opens a confirmation sheet before calling the final callback and restores focus when closed", async () => {
    const onConfirm = jest.fn();
    const DecisionFlow = () => {
      const [outcome, setOutcome] = useState<
        "approved" | "changes_requested" | null
      >(null);
      const returnFocusRef = useRef<HTMLButtonElement>(null);
      return (
        <>
          <ReviewerDecisionComposer
            developerMessage="Fix the Spanish listing."
            onDeveloperMessageChange={jest.fn()}
            onOverrideReasonChange={jest.fn()}
            onSelectOutcome={setOutcome}
            overrideReason=""
            returnFocusRef={returnFocusRef}
            saveState="idle"
          />
          <ReviewerDecisionConfirmation
            checklistProgress={{ completed: 4, total: 5 }}
            decision={outcome}
            developerMessage="Fix the Spanish listing."
            failedLabels={["Listing and localization"]}
            onConfirm={onConfirm}
            onOpenChange={(open) => {
              if (!open) setOutcome(null);
            }}
            open={outcome !== null}
            returnFocusRef={returnFocusRef}
            testTarget={testTarget}
          />
        </>
      );
    };

    render(<DecisionFlow />);
    const initialAction = screen.getByRole("button", {
      name: "Request changes",
    });
    fireEvent.click(initialAction);

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).getAllByText("Draft app", {
        exact: true,
      }),
    ).toHaveLength(2);
    expect(screen.getByText("4 of 5 checks complete")).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).getByLabelText(
        "Formatted developer message",
      ).textContent,
    ).toBe(
      "Fix the Spanish listing.\n\nFailed guideline checks:\n- Listing and localization",
    );
    expect(
      screen.getByLabelText("World App draft QR code"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm request changes" }),
    ).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(initialAction).toHaveFocus());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("renders an empty approval preview exactly as formatted", () => {
    render(
      <ReviewerDecisionConfirmation
        checklistProgress={{ completed: 5, total: 5 }}
        decision="approved"
        developerMessage=""
        failedLabels={[]}
        onConfirm={jest.fn()}
        onOpenChange={jest.fn()}
        open
        testTarget={testTarget}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Confirm approval" }),
    ).toBeEnabled();
    expect(
      screen.getByLabelText("Formatted developer message").textContent,
    ).toBe("");
  });

  it("uses a 360-pixel desktop rail and a compact mobile target with bottom dock", () => {
    render(
      <ReviewerActionRail
        checklistProgress={{ completed: 3, total: 5 }}
        onOpenComposer={jest.fn()}
        saveState="saved"
        testTarget={testTarget}
      >
        <p>Decision actions</p>
      </ReviewerActionRail>,
    );

    expect(screen.getByTestId("reviewer-desktop-action-rail")).toHaveClass(
      "lg:w-[360px]",
    );
    expect(screen.getByTestId("reviewer-mobile-test-target")).toHaveClass(
      "lg:hidden",
    );
    expect(screen.getByText("3 of 5 checks complete")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Message and decide" }),
    ).toBeEnabled();
  });

  it("blocks the mobile composer while the checklist save is in error", () => {
    const onOpenComposer = jest.fn();
    render(
      <ReviewerActionRail
        checklistProgress={{ completed: 3, total: 5 }}
        onOpenComposer={onOpenComposer}
        saveState="error"
        testTarget={testTarget}
      >
        <p>Decision actions</p>
      </ReviewerActionRail>,
    );

    const messageAndDecide = screen.getByRole("button", {
      name: "Message and decide",
    });
    expect(messageAndDecide).toBeDisabled();
    expect(messageAndDecide).toHaveAccessibleDescription(
      "Checklist save failed. Decisions are unavailable.",
    );
    fireEvent.click(messageAndDecide);
    expect(onOpenComposer).not.toHaveBeenCalled();
  });
});

describe("reviewer timing and submitted images", () => {
  it("hydrates claim, overview, and history dates from stable server output", () => {
    const originalLocaleString = Date.prototype.toLocaleString;
    let locale = "server locale";
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    jest
      .spyOn(Date.prototype, "toLocaleString")
      .mockImplementation(() => locale);
    const claimExpiresAt = "2026-08-31T12:30:00.000Z";
    const historyEvent = {
      id: "hydration-event",
      eventType: "submitted" as const,
      eventSequence: 1,
      actorEmail: "dev@example.com",
      actorSubject: "developer-subject",
      createdAt: "2026-08-31T12:00:00.000Z",
      payload: {},
      reviewVersion: 1,
    };
    const tree = (
      <>
        <ReviewClaimBar
          canReview
          claimExpiresAt={claimExpiresAt}
          claimedByEmail="former-reviewer@example.com"
          currentUserEmail="reviewer@example.com"
          reviewId="00000000-0000-4000-8000-000000000001"
          reviewVersion={4}
          status="in_review"
        />
        <ReviewOverview submission={detailFixture} />
        <ReviewHistory
          canReview={false}
          events={[historyEvent]}
          notifications={[]}
        />
      </>
    );
    const container = document.createElement("div");

    try {
      container.innerHTML = renderToString(tree);
      locale = "client locale";
      document.body.appendChild(container);

      act(() => {
        render(tree, { container, hydrate: true });
      });

      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      container.remove();
      Date.prototype.toLocaleString = originalLocaleString;
      consoleError.mockRestore();
    }
  });

  it("renders submitted images with lazy decoding and stable dimensions", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        assets: [
          {
            id: "hero",
            kind: "hero",
            label: "Store hero image",
            locale: "en",
            signedUrl: "https://signed.example/hero.png",
            width: 1200,
            height: 630,
          },
          {
            id: "logo",
            kind: "logo",
            label: "App logo",
            locale: "en",
            signedUrl: "https://signed.example/logo.png",
          },
        ],
      }),
    } as Response);

    render(<ReviewMetadata submission={detailFixture} />);

    const hero = await screen.findByRole("img", {
      name: "Store hero image, English",
    });
    expect(hero).toHaveAttribute("loading", "lazy");
    expect(hero).toHaveAttribute("decoding", "async");
    expect(hero).toHaveAttribute("width", "1200");
    expect(hero).toHaveAttribute("height", "630");

    const logo = screen.getByRole("img", { name: "App logo, English" });
    expect(logo).toHaveAttribute("width", "1");
    expect(logo).toHaveAttribute("height", "1");
  });
});
