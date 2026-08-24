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
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
    <button {...props}>{children}</button>
  ),
}));
// #endregion

import { SandboxRequestIosActions } from "@/scenes/Admin/sandbox-requests-ios/SandboxRequestIosActions";

// #region Test Data
const REQUEST_ID = "sbx_req_abc123";

const mockResponse = (options: {
  ok: boolean;
  body: unknown;
  status?: number;
}) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: options.ok,
    status: options.status ?? (options.ok ? 200 : 503),
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

  it("sends an explicit revoked state and explains partial ASC failure", async () => {
    mockResponse({
      ok: false,
      body: { failureStage: "testflight_reconciliation" },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="approved" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "TestFlight reconciliation failed during the revocation. The portal status may already have changed; retry the action.",
      ),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/admin/sandbox-requests-ios/${REQUEST_ID}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "revoked" }),
      },
    );
  });

  it("explains when rejection fails before TestFlight is changed", async () => {
    mockResponse({
      ok: false,
      body: { failureStage: "portal_status_update" },
    });
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="pending" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "The portal status update failed before the rejection reached TestFlight. No TestFlight change was made.",
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
        "The approval failed at an unknown stage. Refresh to check its current status before retrying.",
      ),
    );
  });
});
// #endregion

// #region Concurrent status feedback
describe("SandboxRequestIosActions [concurrent changes]", () => {
  it("alerts when another admin supersedes the requested action", async () => {
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
        "The approval was superseded by another admin. The final status is revoked.",
      ),
    );
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("alerts when the final state cannot be confirmed", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
    render(
      <SandboxRequestIosActions requestId={REQUEST_ID} status="approved" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Couldn't confirm the revocation. Refresh to check its current status before retrying.",
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
// #endregion
