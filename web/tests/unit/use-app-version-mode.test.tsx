/**
 * @jest-environment jsdom
 */

import { act, renderHook } from "@testing-library/react";
import { Provider, createStore, useAtomValue } from "jotai";
import { PropsWithChildren } from "react";
import { viewModeAtom } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/layout/ImagesProvider";
import { useAppVersionMode } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/useAppVersionMode";

const replace = jest.fn();

let mockPathname = "/teams/team_123/apps/app_123/configuration";
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    replace,
  }),
  useSearchParams: () => mockSearchParams,
}));

const renderUseAppVersionMode = (
  params: Parameters<typeof useAppVersionMode>[0],
) => {
  const store = createStore();
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );

  const result = renderHook(
    (hookParams: Parameters<typeof useAppVersionMode>[0]) => ({
      appVersionMode: useAppVersionMode(hookParams),
      storedViewMode: useAtomValue(viewModeAtom),
    }),
    { initialProps: params, wrapper },
  );

  return { ...result, store };
};

describe("useAppVersionMode", () => {
  beforeEach(() => {
    replace.mockReset();
    mockPathname = "/teams/team_123/apps/app_123/configuration";
    mockSearchParams = new URLSearchParams();
  });

  it("normalizes a stale current version param to the approved-only view", () => {
    mockSearchParams = new URLSearchParams("version=current");

    const { result } = renderUseAppVersionMode({
      hasDraft: false,
      hasVerified: true,
    });

    expect(result.current.appVersionMode.version).toBe("approved");
    expect(result.current.appVersionMode.viewMode).toBe("verified");
    expect(result.current.storedViewMode).toBe("verified");
    expect(
      result.current.appVersionMode.getVersionedPath(
        "/teams/team_123/apps/app_123/configuration",
      ),
    ).toBe("/teams/team_123/apps/app_123/configuration");
  });

  it("switches to current immediately after creating a new draft", () => {
    mockSearchParams = new URLSearchParams("version=approved");

    const { result, rerender } = renderUseAppVersionMode({
      hasDraft: false,
      hasVerified: true,
      teamId: "team_123",
      appId: "app_123",
    });

    act(() => {
      result.current.appVersionMode.setViewMode("unverified", {
        hasDraft: true,
        hasVerified: true,
      });
    });

    expect(replace).toHaveBeenCalledWith(
      "/teams/team_123/apps/app_123/configuration?version=current",
    );
    mockSearchParams = new URLSearchParams("version=current");
    rerender({
      hasDraft: true,
      hasVerified: true,
      teamId: "team_123",
      appId: "app_123",
    });

    expect(result.current.appVersionMode.version).toBe("current");
    expect(result.current.storedViewMode).toBe("unverified");
  });

  it("stays on mini app routes when a freshly created draft is also a mini app", () => {
    mockPathname = "/teams/team_123/apps/app_123/mini-app/permissions";
    mockSearchParams = new URLSearchParams("version=approved");

    const { result } = renderUseAppVersionMode({
      hasDraft: false,
      hasVerified: true,
      hasDraftMiniApp: false,
      hasVerifiedMiniApp: true,
      teamId: "team_123",
      appId: "app_123",
    });

    act(() => {
      result.current.appVersionMode.setViewMode("unverified", {
        hasDraft: true,
        hasVerified: true,
        hasDraftMiniApp: true,
        hasVerifiedMiniApp: true,
      });
    });

    expect(replace).toHaveBeenCalledWith(
      "/teams/team_123/apps/app_123/mini-app/permissions?version=current",
    );
  });

  it("redirects mini app routes to configuration when the selected version is not a mini app", () => {
    mockPathname = "/teams/team_123/apps/app_123/mini-app/permissions";
    mockSearchParams = new URLSearchParams("version=approved");

    const { result } = renderUseAppVersionMode({
      hasDraft: true,
      hasVerified: true,
      hasDraftMiniApp: false,
      hasVerifiedMiniApp: true,
      teamId: "team_123",
      appId: "app_123",
    });

    act(() => {
      result.current.appVersionMode.setViewMode("unverified");
    });

    expect(replace).toHaveBeenCalledWith(
      "/teams/team_123/apps/app_123/configuration?version=current",
    );
  });
});
