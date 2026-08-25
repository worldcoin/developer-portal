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
    loading,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
    <button data-loading={loading || undefined} {...props}>
      {children}
    </button>
  ),
}));
// #endregion

import { SandboxRequestIosActions } from "@/scenes/Admin/sandbox-requests-ios/SandboxRequestIosActions";

// #region Test Data
const REQUEST_ID = "sbx_req_abc123";

const mockResponse = (options: { ok: boolean; body: unknown }) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: options.ok,
    json: jest.fn().mockResolvedValue(options.body),
  }) as unknown as typeof fetch;
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Failure-stage feedback
describe("SandboxRequestIosActions [failure feedback]", () => {
  it("explains when ASC enrollment fails before approval is saved", async () => {
    mockResponse({
      ok: false,
      body: { failureStage: "testflight_update" },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="pending" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "App Store Connect enrollment failed. The approval was not saved.",
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
  });

  it("keeps a confirmed failed revocation visually approved and retryable", async () => {
    mockResponse({
      ok: false,
      body: {
        failureStage: "testflight_update",
        status: "approved",
      },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="approved" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "App Store Connect removal failed. Access still appears approved; retry the revocation.",
      ),
    );
    expect(screen.getByRole("button", { name: "Revoke" })).toBeEnabled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes an ambiguous revocation so its retry action is exposed", async () => {
    mockResponse({
      ok: false,
      body: {
        failureStage: "testflight_update",
        status: "revoking",
      },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="approved" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("identifies a revocation finalization failure", async () => {
    mockResponse({
      ok: false,
      body: {
        failureStage: "revocation_finalize",
        status: "revoking",
      },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="approved" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "App Store Connect removal succeeded, but the portal could not finalize it. Retry the revocation.",
      ),
    );
  });

  it("does not expose an untrusted server failure stage", async () => {
    mockResponse({
      ok: false,
      body: { failureStage: "raw internal error" },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="pending" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "The approval failed at an unknown stage. Refresh before retrying.",
      ),
    );
  });
});
// #endregion

// #region Rejection reason
describe("SandboxRequestIosActions [rejection]", () => {
  it("collects an optional reason before posting a rejection", async () => {
    mockResponse({
      ok: true,
      body: { success: true, changed: true, status: "rejected" },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="pending" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Rejection reason"), {
      target: { value: "Use the Apple Account email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/sandbox-requests-ios/${REQUEST_ID}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "rejected",
            reason: "Use the Apple Account email",
          }),
        },
      ),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("explains that a failed rejection never reached App Store Connect", async () => {
    mockResponse({
      ok: false,
      body: { failureStage: "portal_status_update" },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="pending" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "The rejection could not be saved. No App Store Connect change was attempted.",
      ),
    );
  });
});
// #endregion

// #region Interaction and concurrent status feedback
describe("SandboxRequestIosActions [interaction]", () => {
  it("shows pressed/loading feedback while revocation is running", async () => {
    let resolveFetch:
      | ((response: { ok: boolean; json: () => Promise<unknown> }) => void)
      | undefined;
    global.fetch = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    ) as unknown as typeof fetch;
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="approved" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    expect(screen.getByRole("button", { name: "Revoke" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Revoke" })).toHaveAttribute(
      "data-loading",
      "true",
    );

    resolveFetch?.({
      ok: false,
      json: async () => ({
        failureStage: "testflight_update",
        status: "approved",
      }),
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Revoke" })).toBeEnabled(),
    );
  });

  it("offers an explicit retry for a recovered revoking row", () => {
    mockResponse({
      ok: true,
      body: { success: true, changed: true, status: "revoked" },
    });

    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="revoking" />,
    );

    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });

  it("alerts and refreshes when another admin supersedes the action", async () => {
    mockResponse({
      ok: true,
      body: { success: true, changed: false, status: "revoked" },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="pending" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "The approval was superseded. The current status is revoked.",
      ),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes after a network failure because the outcome is unknown", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="approved" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Couldn't confirm the revocation. Refresh before retrying.",
      ),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
// #endregion
