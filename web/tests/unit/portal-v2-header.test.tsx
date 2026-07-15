/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const useParams = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => useParams(),
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

import { Header } from "@/scenes/Portal/layout/Header";
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
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
