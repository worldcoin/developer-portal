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
jest.mock("@/scenes/Onboarding/CreateTeam/layout", () => ({
  CreateTeamLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="create-team-layout">{children}</div>
  ),
}));

import CreateTeamRootLayout from "../../app/(onboarding)/create-team/layout";

beforeEach(() => {
  jest.clearAllMocks();
  mockHeaderGet.mockReturnValue("create-team-nonce");
});

it("mounts the create-team layout and page inside Apollo", async () => {
  render(
    await CreateTeamRootLayout({
      children: <div data-testid="create-team-page" />,
    }),
  );

  const apolloWrapper = screen.getByTestId("apollo-wrapper");
  expect(apolloWrapper).toHaveAttribute("data-nonce", "create-team-nonce");
  expect(
    within(apolloWrapper).getByTestId("create-team-layout"),
  ).toBeInTheDocument();
  expect(
    within(apolloWrapper).getByTestId("create-team-page"),
  ).toBeInTheDocument();
});
