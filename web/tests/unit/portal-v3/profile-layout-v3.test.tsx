/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/lib/auth0", () => ({
  auth0: {
    getSession: jest
      .fn()
      .mockResolvedValue({ user: { name: "Ada", email: "ada@example.com" } }),
  },
}));
jest.mock("@/scenes/PortalV3/Shell/UserPopup", () => ({
  UserPopup: () => <div data-testid="user-popup" />,
}));
jest.mock("@/scenes/PortalV3/Shell/ColorInitializer", () => ({
  ColorInitializer: () => null,
}));

import { ProfileLayoutV3 } from "@/scenes/PortalV3/Profile/layout";

describe("ProfileLayoutV3", () => {
  it("wraps account content with a close-X and the bottom user menu (no tabs)", async () => {
    const element = await ProfileLayoutV3({
      children: <div data-testid="page-body">profile content</div>,
    });
    render(element);

    // The v2 account page content renders as-is.
    expect(screen.getByTestId("page-body")).toBeInTheDocument();
    expect(screen.getByTestId("portal-v3-account-shell")).toBeInTheDocument();
    // Bottom user menu now persists in the account chrome.
    expect(screen.getByTestId("user-popup")).toBeInTheDocument();

    // Close-X returns to the main app; "/" resolves to the team dashboard.
    const close = screen.getByRole("link", { name: /back to/i });
    expect(close).toHaveAttribute("href", "/");

    // No v2 account tabs in this minimal chrome.
    expect(screen.queryByText("Danger zone")).not.toBeInTheDocument();
  });
});
