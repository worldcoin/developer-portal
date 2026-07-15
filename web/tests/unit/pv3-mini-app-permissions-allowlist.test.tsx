/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { SetupForm } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/MiniApp/PermissionsForm";
import { fireEvent, render, screen, within } from "@testing-library/react";

// #region Mocks
const mockUseAutosaveWithStatus = jest.fn();

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: {} }),
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-autosave-with-status",
  () => ({
    useAutosaveWithStatus: (...args: unknown[]) =>
      mockUseAutosaveWithStatus(...args),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/SaveStatus",
  () => ({
    SaveStatusIndicator: () => null,
    useSaveStatus: () => ({
      flushAll: jest.fn().mockResolvedValue(true),
      displayStatus: { state: "idle" },
    }),
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Advanced/page/server/submit",
  () => ({
    validateAndUpdateSetupServerSide: jest
      .fn()
      .mockResolvedValue({ success: true }),
  }),
);
// #endregion

// #region Test Data
const address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const appMetadata = {
  id: "meta_1234567890abcdef1234567890abcdef",
  verification_status: "unverified",
  app_mode: "mini-app",
  whitelisted_addresses: null,
  associated_domains: null,
  contracts: null,
  permit2_tokens: null,
  can_import_all_contacts: false,
  can_use_attestation: false,
  is_allowed_unlimited_notifications: false,
  max_notifications_per_day: 0,
  integration_url: null,
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Derived payment allowlist state
describe("Mini App payment allowlist", () => {
  it("enables enforcement with the first address and disables it with the last removal", () => {
    render(
      <SetupForm
        appId="app_1234567890abcdef1234567890abcdef"
        teamId="team_1234567890abcdef1234567890abcdef"
        appMetadata={appMetadata as never}
      />,
    );

    const form = mockUseAutosaveWithStatus.mock.calls[0][0].form;
    const input = screen.getByPlaceholderText("Paste wallet address");

    expect(
      screen.queryByText("Enforce payment allowlist"),
    ).not.toBeInTheDocument();
    expect(form.getValues("is_whitelist_disabled")).toBe(true);

    fireEvent.change(input, { target: { value: address } });
    fireEvent.click(
      within(input.parentElement as HTMLElement).getByRole("button", {
        name: "Add",
      }),
    );

    expect(form.getValues("whitelisted_addresses")).toBe(address);
    expect(form.getValues("is_whitelist_disabled")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: `Remove ${address}` }));

    expect(form.getValues("whitelisted_addresses")).toBeNull();
    expect(form.getValues("is_whitelist_disabled")).toBe(true);
  });
});
// #endregion

// #region Notification limit slider
describe("Mini App notification limit", () => {
  it("stores the selected checkpoint value", () => {
    render(
      <SetupForm
        appId="app_1234567890abcdef1234567890abcdef"
        teamId="team_1234567890abcdef1234567890abcdef"
        appMetadata={appMetadata as never}
      />,
    );

    const form = mockUseAutosaveWithStatus.mock.calls[0][0].form;
    const slider = screen.getByRole("slider", {
      name: "Maximum notifications per user each day",
    });

    expect(slider).toHaveValue("0");
    expect(slider).toHaveAttribute("aria-valuetext", "0");

    fireEvent.change(slider, { target: { value: "3" } });

    expect(form.getValues("max_notifications_per_day")).toBe("unlimited");
    expect(slider).toHaveValue("3");
    expect(slider).toHaveAttribute("aria-valuetext", "Unlimited");
  });
});
// #endregion
