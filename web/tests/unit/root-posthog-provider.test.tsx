/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUsePathname = jest.fn();
const mockUseUser = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => mockUseUser(),
}));

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    reset: jest.fn(),
    has_opted_out_capturing: jest.fn(() => false),
    has_opted_in_capturing: jest.fn(() => false),
    opt_out_capturing: jest.fn(),
    opt_in_capturing: jest.fn(),
    identify: jest.fn(),
  },
}));

jest.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import WithPostHogIdentifier from "@/scenes/Root/providers/providers";

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePathname.mockReturnValue("/teams/team_1/apps");
  mockUseUser.mockReturnValue({ user: null });
});

describe("root PostHog provider", () => {
  it("loads the Auth0 user on portal pages", () => {
    render(
      <WithPostHogIdentifier>
        <div>Portal content</div>
      </WithPostHogIdentifier>,
    );

    expect(screen.getByText("Portal content")).toBeInTheDocument();
    expect(mockUseUser).toHaveBeenCalledTimes(1);
  });

  it.each(["/admin", "/admin/users"])(
    "does not load the Auth0 user on %s",
    (pathname) => {
      mockUsePathname.mockReturnValue(pathname);

      render(
        <WithPostHogIdentifier>
          <div>Admin content</div>
        </WithPostHogIdentifier>,
      );

      expect(screen.getByText("Admin content")).toBeInTheDocument();
      expect(mockUseUser).not.toHaveBeenCalled();
    },
  );

  it("does not load the Auth0 user for an admin host root rewrite", () => {
    mockUsePathname.mockReturnValue("/");

    render(
      <WithPostHogIdentifier disableUserIdentification>
        <div>Admin content</div>
      </WithPostHogIdentifier>,
    );

    expect(screen.getByText("Admin content")).toBeInTheDocument();
    expect(mockUseUser).not.toHaveBeenCalled();
  });

  it("loads the Auth0 user after leaving an admin host root rewrite", () => {
    mockUsePathname.mockReturnValue("/");
    const { rerender } = render(
      <WithPostHogIdentifier disableUserIdentification>
        <div>Content</div>
      </WithPostHogIdentifier>,
    );

    mockUsePathname.mockReturnValue("/teams/team_1/apps");
    rerender(
      <WithPostHogIdentifier disableUserIdentification>
        <div>Content</div>
      </WithPostHogIdentifier>,
    );

    expect(mockUseUser).toHaveBeenCalledTimes(1);
  });
});
