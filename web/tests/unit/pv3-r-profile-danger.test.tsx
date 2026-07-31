/** @jest-environment jsdom */
import "@testing-library/jest-dom";

const mockRedirect = jest.fn();

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("@/scenes/Portal/Profile/DangerZone/page", () => ({
  DangerZone: () => null,
}));
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

import RoutePage from "../../app/(portal)/profile/danger/page";

it("redirects the legacy v3 danger route to the consolidated profile", async () => {
  await RoutePage();

  expect(mockRedirect).toHaveBeenCalledWith("/profile");
});
