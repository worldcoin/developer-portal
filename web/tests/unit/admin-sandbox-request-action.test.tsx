/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const refresh = jest.fn();
const toastError = jest.fn();

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
// #endregion

import { MarkInviteSentButton } from "@/scenes/Admin/sandbox-requests/MarkInviteSentButton";

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Mark invite sent
describe("MarkInviteSentButton", () => {
  it("marks the request and refreshes the admin table", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    }) as unknown as typeof fetch;

    render(<MarkInviteSentButton requestId="sbxreq_abc123" />);
    fireEvent.click(screen.getByRole("button", { name: "Mark invite sent" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/sandbox-requests/sbxreq_abc123/accept",
      { method: "POST" },
    );
    expect(screen.getByRole("button", { name: "Invite sent" })).toBeDisabled();
  });

  it("keeps the action retryable when the backend rejects it", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    }) as unknown as typeof fetch;

    render(<MarkInviteSentButton requestId="sbxreq_abc123" />);
    fireEvent.click(screen.getByRole("button", { name: "Mark invite sent" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(refresh).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Mark invite sent" }),
    ).toBeEnabled();
  });
});
// #endregion
