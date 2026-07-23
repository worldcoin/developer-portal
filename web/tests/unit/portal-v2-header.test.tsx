/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const useParams = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => useParams(),
}));

// Getter so each test can flip the kill switch (a plain constant in prod).
const sandboxEnabled = jest.fn<boolean, []>();
jest.mock("@/lib/constants", () => ({
  ...jest.requireActual("@/lib/constants"),
  get WORLD_ID_SANDBOX_ENABLED() {
    return sandboxEnabled();
  },
}));

jest.mock("@/components/Icons/WorldIcon", () => ({
  WorldIcon: () => <span>World logo</span>,
}));

jest.mock("@/components/LoggedUserNav", () => ({
  LoggedUserNav: () => null,
}));

jest.mock("@/scenes/Portal/layout/AppSelector", () => ({
  AppSelector: () => null,
}));

jest.mock("@/scenes/Portal/layout/CreateAppDialog/index-v4", () => ({
  CreateAppDialogV4: () => null,
}));

jest.mock("@/scenes/PortalV3/layout/Shell/SandboxButton", () => ({
  SandboxButton: () => <button>World ID Sandbox</button>,
}));

import { Header } from "@/scenes/Portal/layout/Header";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  sandboxEnabled.mockReturnValue(true);
});

// #region World logo routing
describe("v2 Header [World logo routing]", () => {
  it("links to the team when viewing an app", () => {
    useParams.mockReturnValue({ teamId: "team_1", appId: "app_1" });

    render(<Header color={null} />);

    expect(screen.getByRole("link", { name: "World logo" })).toHaveAttribute(
      "href",
      "/teams/team_1",
    );
  });

  it("links to the portal root when no team is selected", () => {
    useParams.mockReturnValue({});

    render(<Header color={null} />);

    expect(screen.getByRole("link", { name: "World logo" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
// #endregion

// #region Sandbox button gating
describe("v2 Header [sandbox button gating]", () => {
  it("shows the sandbox button on a team route when the switch is on", () => {
    useParams.mockReturnValue({ teamId: "team_1" });

    render(<Header color={null} />);

    expect(
      screen.getByRole("button", { name: "World ID Sandbox" }),
    ).toBeInTheDocument();
  });

  it("hides the sandbox button when the switch is off", () => {
    useParams.mockReturnValue({ teamId: "team_1" });
    sandboxEnabled.mockReturnValue(false);

    render(<Header color={null} />);

    expect(
      screen.queryByRole("button", { name: "World ID Sandbox" }),
    ).not.toBeInTheDocument();
  });

  it("hides the sandbox button outside a team route", () => {
    useParams.mockReturnValue({});

    render(<Header color={null} />);

    expect(
      screen.queryByRole("button", { name: "World ID Sandbox" }),
    ).not.toBeInTheDocument();
  });
});
// #endregion
