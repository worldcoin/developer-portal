/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import React from "react";

const mockHeaderGet = jest.fn();

jest.mock("next/headers", () => ({
  headers: async () => ({ get: mockHeaderGet }),
}));
jest.mock("@/lib/apollo-wrapper", () => ({
  ApolloWrapper: ({
    children,
    nonce,
  }: {
    children: React.ReactNode;
    nonce?: string;
  }) => (
    <div data-testid="apollo-wrapper" data-nonce={nonce}>
      {children}
    </div>
  ),
}));
jest.mock("@/scenes/PortalV3/layout", () => ({
  PortalLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="portal-shell">{children}</div>
  ),
}));
jest.mock("@/scenes/Onboarding/CreateTeam/Dialog", () => ({
  CreateTeamDialog: () => <div data-testid="create-team-dialog" />,
}));
jest.mock("@/scenes/common/layout/CreateAppDialog", () => ({
  CreateAppDialog: () => <div data-testid="create-app-dialog" />,
}));

import PortalRootLayout from "../../app/(portal)/layout";

const renderLayout = async () =>
  render(
    await PortalRootLayout({
      children: <div data-testid="portal-page" />,
    }),
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockHeaderGet.mockReturnValue("test-nonce");
});

it("mounts the portal shell, page, and dialogs inside Apollo with the request nonce", async () => {
  await renderLayout();

  const apolloWrapper = screen.getByTestId("apollo-wrapper");
  expect(mockHeaderGet).toHaveBeenCalledWith("x-nonce");
  expect(apolloWrapper).toHaveAttribute("data-nonce", "test-nonce");
  expect(within(apolloWrapper).getByTestId("portal-page")).toBeInTheDocument();
  expect(screen.getByTestId("portal-shell")).toBeInTheDocument();
  expect(screen.getByTestId("create-app-dialog")).toBeInTheDocument();
  expect(screen.getByTestId("create-team-dialog")).toBeInTheDocument();
});

it("renders the shell when the request has no nonce", async () => {
  mockHeaderGet.mockReturnValue(null);

  await renderLayout();

  expect(screen.getByTestId("apollo-wrapper")).not.toHaveAttribute(
    "data-nonce",
  );
  expect(screen.getByTestId("portal-page")).toBeInTheDocument();
});
