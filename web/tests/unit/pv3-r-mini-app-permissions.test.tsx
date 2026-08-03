/** @jest-environment jsdom */
import "@testing-library/jest-dom";

const redirect = jest.fn();

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: async (v3: () => unknown) => v3(),
}));
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));
jest.mock(
  "@/scenes/Portal/Teams/TeamId/Apps/AppId/MiniApp/Permissions/page",
  () => ({
    AppPermissionsPage: () => null,
  }),
);
import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/permissions/page";

it("redirects the v3 permissions route to Develop", async () => {
  await RoutePage({
    params: Promise.resolve({ teamId: "team_1", appId: "app_1" }),
  });

  expect(redirect).toHaveBeenCalledWith("../develop");
});
