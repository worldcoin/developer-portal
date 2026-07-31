/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

// #region Mocks
const mockUpdateAppMode = jest.fn();
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/MiniAppConfiguration/server/submit",
  () => ({
    updateAppMode: (...args: unknown[]) => mockUpdateAppMode(...args),
  }),
);

const mockCacheIdentify = jest.fn();
const mockCacheModify = jest.fn();
const mockRefetchQueries = jest.fn();
const mockApolloClient = {
  cache: {
    identify: (...args: unknown[]) => mockCacheIdentify(...args),
    modify: (...args: unknown[]) => mockCacheModify(...args),
  },
  refetchQueries: (...args: unknown[]) => mockRefetchQueries(...args),
};
jest.mock("@apollo/client/react", () => ({
  useApolloClient: () => mockApolloClient,
}));

const mockToastError = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: jest.fn(() => true),
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({
    user: {
      hasura: {
        memberships: [{ team: { id: "team_1" }, role: "OWNER" }],
      },
    },
  }),
}));

import { getDefaultStore } from "jotai";
import { AppMetadata } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/AppStore/types/AppStoreFormTypes";
import { isMiniAppAtom } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/layout/ImagesProvider";
import { useAppModeToggle } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/MiniAppConfiguration";
import { LogoDropZone } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/LogoDropZone";
// #endregion

// #region Test Data
const makeAppMetadata = (overrides: Partial<AppMetadata> = {}): AppMetadata =>
  ({
    id: "meta_1",
    app_mode: "mini-app",
    category: "External",
    verification_status: "unverified",
    ...overrides,
  }) as AppMetadata;
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  mockCacheIdentify.mockReturnValue("app_metadata:meta_1");
  mockUpdateAppMode.mockResolvedValue({ success: true });
  getDefaultStore().set(isMiniAppAtom, false);
});

// #region App mode persistence
describe("useAppModeToggle [in-place persistence]", () => {
  it("persists both mode changes and updates the cache without refetching", async () => {
    const { result } = renderHook(() =>
      useAppModeToggle({
        teamId: "team_1",
        appMetadata: makeAppMetadata(),
      }),
    );

    await waitFor(() => expect(result.current.isMiniApp).toBe(true));

    await act(async () => {
      await result.current.handleAppModeToggle(false);
    });
    expect(result.current.isMiniApp).toBe(false);

    await act(async () => {
      await result.current.handleAppModeToggle(true);
    });
    expect(result.current.isMiniApp).toBe(true);

    expect(mockUpdateAppMode.mock.calls).toEqual([
      ["meta_1", "external"],
      ["meta_1", "mini-app"],
    ]);
    expect(mockCacheIdentify).toHaveBeenCalledTimes(2);
    expect(mockCacheModify).toHaveBeenCalledTimes(2);

    const externalFields = mockCacheModify.mock.calls[0][0].fields;
    expect(externalFields.app_mode()).toBe("external");
    expect(externalFields.category).toBeUndefined();

    const miniAppFields = mockCacheModify.mock.calls[1][0].fields;
    expect(miniAppFields.app_mode()).toBe("mini-app");
    expect(miniAppFields.category("External")).toBe("Other");
    expect(miniAppFields.category("Finance")).toBe("Finance");

    expect(mockRefetchQueries).not.toHaveBeenCalled();
  });

  it("reverts the optimistic mode and leaves the cache alone on failure", async () => {
    mockUpdateAppMode.mockResolvedValue({
      success: false,
      message: "Could not save app mode",
    });
    const { result } = renderHook(() =>
      useAppModeToggle({
        teamId: "team_1",
        appMetadata: makeAppMetadata({ app_mode: "external" }),
      }),
    );

    await waitFor(() => expect(result.current.isMiniApp).toBe(false));

    await act(async () => {
      await result.current.handleAppModeToggle(true);
    });

    expect(result.current.isMiniApp).toBe(false);
    expect(mockCacheModify).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith("Could not save app mode");
  });
});
// #endregion

// #region Logo hover feedback
describe("LogoDropZone [existing logo]", () => {
  it("darkens an editable logo on hover and focus, but not a disabled logo", () => {
    const { rerender } = render(
      <LogoDropZone
        imageUrl="https://cdn.example/logo.png"
        onFileSelected={jest.fn()}
      />,
    );

    // The logo <img> is decorative (alt="") since #2195; the label is named
    // by its sr-only text instead.
    const editableLabel = screen.getByText("Upload app logo").closest("label");
    const hoverShade = editableLabel?.querySelector('span[aria-hidden="true"]');
    expect(editableLabel).toHaveClass("group", "cursor-pointer");
    expect(hoverShade).toHaveClass(
      "bg-grey-900/50",
      "opacity-0",
      "group-hover:opacity-100",
      "group-focus-within:opacity-100",
    );

    rerender(
      <LogoDropZone
        imageUrl="https://cdn.example/logo.png"
        onFileSelected={jest.fn()}
        disabled
      />,
    );

    const disabledLabel = screen.getByText("Upload app logo").closest("label");
    expect(
      disabledLabel?.querySelector('span[aria-hidden="true"]'),
    ).not.toBeInTheDocument();
  });
});
// #endregion
