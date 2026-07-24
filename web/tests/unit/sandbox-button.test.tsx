/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { email: "dev@example.com" } }),
}));

jest.mock("posthog-js", () => ({ capture: jest.fn() }));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));

jest.mock("react-qr-code", () => ({
  __esModule: true,
  default: () => <div data-testid="qr-code" />,
}));

jest.mock("@/scenes/PortalV3/common/Icon", () => ({
  Icon: () => null,
}));

jest.mock("@/components/Dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role="dialog">{children}</div> : null,
}));

jest.mock("@/components/DialogOverlay", () => ({
  DialogOverlay: () => null,
}));

jest.mock("@/components/DialogPanel", () => ({
  DialogPanel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
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

import { SandboxButton } from "@/scenes/PortalV3/layout/Shell/SandboxButton";
// #endregion

// #region Test Data
const mockLookup = (request: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, request }),
  }) as unknown as typeof fetch;
};

const openAndroidSection = () => {
  render(<SandboxButton />);
  fireEvent.click(screen.getByRole("button", { name: /World ID Sandbox/ }));
  fireEvent.click(screen.getByRole("button", { name: "Android" }));
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Persistent request confirmation
describe("SandboxButton [android request confirmation]", () => {
  it("keeps the submitted email visible in the persistent pending state", async () => {
    mockLookup({
      email: "tester@gmail.com",
      accepted: false,
      createdAt: "2026-07-23T00:00:00Z",
    });

    openAndroidSection();

    expect(
      await screen.findByText(/We'll email you when the invite has been sent/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Google account email" }),
    ).toHaveValue("tester@gmail.com");
    expect(
      screen.getByRole("textbox", { name: "Google account email" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Request submitted" }),
    ).toBeDisabled();
    expect(global.fetch).toHaveBeenCalledWith("/api/v2/sandbox-access-request");
  });

  it("shows invite-sent copy once the backend accepts the request", async () => {
    mockLookup({
      email: "tester@gmail.com",
      accepted: true,
      createdAt: "2026-07-23T00:00:00Z",
    });

    openAndroidSection();

    expect(
      await screen.findByText(/An invite has been sent to tester@gmail.com/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invite sent" })).toBeDisabled();
  });

  it("offers an editable prefilled request form when no request exists", async () => {
    mockLookup(null);

    openAndroidSection();

    const button = await screen.findByRole("button", {
      name: "Request invite",
    });
    await waitFor(() => expect(button).toBeEnabled());
    expect(
      screen.getByRole("textbox", { name: "Google account email" }),
    ).toHaveValue("dev@example.com");
  });

  it("switches to the stored submitted state after a successful request", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, request: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          request: {
            email: "dev@example.com",
            accepted: false,
            createdAt: "2026-07-23T00:00:00Z",
          },
        }),
      }) as unknown as typeof fetch;

    openAndroidSection();

    const button = await screen.findByRole("button", {
      name: "Request invite",
    });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(
      await screen.findByRole("button", { name: "Request submitted" }),
    ).toBeDisabled();
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/v2/sandbox-access-request",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@example.com" }),
      },
    );
  });
});
// #endregion
