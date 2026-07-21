/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import React from "react";

let mockUseV3 = true;
const mockHeaderGet = jest.fn();

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown, v2: () => unknown) =>
    mockUseV3 ? v3() : v2(),
}));
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
jest.mock("@/scenes/Portal/layout", () => ({
  PortalLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="v2-portal">{children}</div>
  ),
}));
jest.mock("@/scenes/PortalV3/layout", () => ({
  PortalLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="v3-portal">{children}</div>
  ),
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
  mockUseV3 = true;
  mockHeaderGet.mockReturnValue("test-nonce");
});

it("mounts the selected v3 shell and page inside Apollo", async () => {
  await renderLayout();

  const apolloWrapper = screen.getByTestId("apollo-wrapper");
  expect(mockHeaderGet).toHaveBeenCalledWith("x-nonce");
  expect(apolloWrapper).toHaveAttribute("data-nonce", "test-nonce");
  expect(within(apolloWrapper).getByTestId("portal-page")).toBeInTheDocument();
  expect(screen.getByTestId("v3-portal")).toBeInTheDocument();
  expect(screen.queryByTestId("v2-portal")).not.toBeInTheDocument();
});

it("mounts the selected v2 shell and page inside Apollo", async () => {
  mockUseV3 = false;

  await renderLayout();

  const apolloWrapper = screen.getByTestId("apollo-wrapper");
  expect(within(apolloWrapper).getByTestId("portal-page")).toBeInTheDocument();
  expect(screen.getByTestId("v2-portal")).toBeInTheDocument();
  expect(screen.queryByTestId("v3-portal")).not.toBeInTheDocument();
});

it("renders the selected shell when the request has no nonce", async () => {
  mockHeaderGet.mockReturnValue(null);

  await renderLayout();

  expect(screen.getByTestId("apollo-wrapper")).not.toHaveAttribute(
    "data-nonce",
  );
  expect(screen.getByTestId("portal-page")).toBeInTheDocument();
});
