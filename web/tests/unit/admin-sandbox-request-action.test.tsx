/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";

// #region Mocks
const refresh = jest.fn();
const toastError = jest.fn();
const fetchSandboxAccessRequests = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args) },
}));

jest.mock("@/components/DecoratedButton", () => ({
  DecoratedButton: ({
    children,
    loading: _loading,
    ...props
  }: {
    children: React.ReactNode;
    loading?: boolean;
  }) => <button {...props}>{children}</button>,
}));

jest.mock(
  "@/scenes/Admin/sandbox-requests/server/fetch-sandbox-requests",
  () => ({
    SANDBOX_REQUESTS_LIMIT: 200,
    fetchSandboxAccessRequests: (...args: unknown[]) =>
      fetchSandboxAccessRequests(...args),
  }),
);
// #endregion

import { ApproveSandboxRequestButton } from "@/scenes/Admin/sandbox-requests/ApproveSandboxRequestButton";
import { AdminSandboxRequestsPage } from "@/scenes/Admin/sandbox-requests/page";

beforeEach(() => {
  jest.clearAllMocks();
  fetchSandboxAccessRequests.mockResolvedValue({
    requests: [
      {
        id: "sbxreq_abc123",
        googleEmail: "tester@example.com",
        userId: "user_123",
        userName: "Tester",
        userEmail: "account@example.com",
        accepted: false,
        createdAt: "2026-07-23T12:00:00.000Z",
        processedAt: null,
      },
    ],
    totalCount: 1,
    pendingCount: 1,
  });
});

// #region Approve sandbox request
describe("ApproveSandboxRequestButton", () => {
  it("approves the request and refreshes the admin table", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    }) as unknown as typeof fetch;

    render(<ApproveSandboxRequestButton requestId="sbxreq_abc123" />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/sandbox-requests/sbxreq_abc123/accept",
      { method: "POST" },
    );
    expect(screen.getByRole("button", { name: "Approved" })).toBeDisabled();
  });

  it("keeps the action retryable when the backend rejects it", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    }) as unknown as typeof fetch;

    render(<ApproveSandboxRequestButton requestId="sbxreq_abc123" />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });
});
// #endregion

// #region Admin request table
describe("AdminSandboxRequestsPage", () => {
  it("renders Approve in the pending request's Action column for writers", async () => {
    render(
      await AdminSandboxRequestsPage({
        canApproveRequests: true,
      }),
    );

    const requestRow = screen.getByText("tester@example.com").closest("tr");
    expect(requestRow).not.toBeNull();
    expect(
      within(requestRow!).getByRole("button", { name: "Approve" }),
    ).toBeEnabled();
  });

  it("shows an accepted request as approved without another action", async () => {
    fetchSandboxAccessRequests.mockResolvedValue({
      requests: [
        {
          id: "sbxreq_abc123",
          googleEmail: "tester@example.com",
          userId: "user_123",
          userName: "Tester",
          userEmail: "account@example.com",
          accepted: true,
          createdAt: "2026-07-23T12:00:00.000Z",
          processedAt: "2026-07-23T13:00:00.000Z",
        },
      ],
      totalCount: 1,
      pendingCount: 0,
    });

    render(
      await AdminSandboxRequestsPage({
        canApproveRequests: true,
      }),
    );

    const requestRow = screen.getByText("tester@example.com").closest("tr");
    expect(requestRow).not.toBeNull();
    expect(
      within(requestRow!).getByText("Approved", { selector: "span" }),
    ).toBeInTheDocument();
    expect(
      within(requestRow!).queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion
