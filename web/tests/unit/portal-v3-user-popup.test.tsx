/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@radix-ui/react-dropdown-menu", () => {
  const Passthrough = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );

  return {
    Root: Passthrough,
    Trigger: ({ children }: { children: React.ReactNode }) => (
      <button>{children}</button>
    ),
    Portal: Passthrough,
    Content: Passthrough,
    Item: Passthrough,
  };
});

import { UserPopup } from "@/scenes/PortalV3/layout/Shell/UserPopup";

it("keeps every link from the previous account menu", () => {
  render(
    <UserPopup
      user={{ name: "Ada Lovelace", email: "ada@example.com" }}
      color={null}
    />,
  );

  [
    "Profile",
    "My Teams",
    "Data Privacy & Security",
    "World Status",
    "FAQ",
    "Join our Telegram",
    "Text Mateo",
    "Join our Discord",
    "Privacy Policy",
    "Terms of service",
    "Docs",
    "Log out",
  ].forEach((label) => {
    expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
  });
});
