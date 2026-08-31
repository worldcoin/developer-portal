/** @jest-environment jsdom */

import React from "react";

jest.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-current-path": "/admin/reviewer" }),
}));
jest.mock("@auth0/nextjs-auth0/client", () => ({
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("jotai", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("react-loading-skeleton", () => ({
  SkeletonTheme: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("react-toastify", () => ({
  Slide: () => null,
  ToastContainer: () => null,
}));
jest.mock("@/scenes/Root/providers/PostHogPageView", () => () => null);
jest.mock("@/scenes/Root/providers/providers", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

import { RootLayout } from "@/scenes/Root/layout";

describe("root layout hydration", () => {
  it("suppresses extension-injected attributes only on the root body", async () => {
    const layout = await RootLayout({ children: <p>Admin content</p> });
    const html = layout as React.ReactElement<{ children: React.ReactNode }>;
    const body = html.props.children as React.ReactElement<{
      suppressHydrationWarning?: boolean;
    }>;

    expect(html.type).toBe("html");
    expect(body.type).toBe("body");
    expect(body.props.suppressHydrationWarning).toBe(true);
  });
});
