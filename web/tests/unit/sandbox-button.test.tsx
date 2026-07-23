/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
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
  DecoratedButton: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
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
  it("shows a persistent pending confirmation instead of the request form", async () => {
    mockLookup({
      email: "tester@gmail.com",
      accepted: false,
      createdAt: "2026-07-23T00:00:00Z",
    });

    openAndroidSection();

    expect(
      await screen.findByText(/Request sent — you'll get an email at/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request access" }),
    ).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith("/api/v2/sandbox-access-request");
  });

  it("shows approved copy once the request is accepted", async () => {
    mockLookup({
      email: "tester@gmail.com",
      accepted: true,
      createdAt: "2026-07-23T00:00:00Z",
    });

    openAndroidSection();

    expect(
      await screen.findByText(/has been approved — scan the QR code/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Request access" }),
    ).not.toBeInTheDocument();
  });

  it("offers the request form when no request exists yet", async () => {
    mockLookup(null);

    openAndroidSection();

    expect(
      await screen.findByRole("button", { name: "Request access" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Request sent — you'll get an email at/),
    ).not.toBeInTheDocument();
  });
});
// #endregion
