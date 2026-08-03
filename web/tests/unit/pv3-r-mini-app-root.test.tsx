/** @jest-environment jsdom */

import "@testing-library/jest-dom";

const pickPortalVersion = jest.fn();
const redirect = jest.fn();

jest.mock("@/lib/feature-flags/portal-v3/activation", () => ({
  pickPortalVersion: (...args: unknown[]) => pickPortalVersion(...args),
}));
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/page";

beforeEach(() => {
  jest.clearAllMocks();
});

it("redirects the v3 Mini App route to Develop", async () => {
  pickPortalVersion.mockImplementation(async (v3: () => unknown) => v3());

  await RoutePage();

  expect(redirect).toHaveBeenCalledWith("./mini-app/develop");
});

it("redirects the v2 Mini App route to Permissions", async () => {
  pickPortalVersion.mockImplementation(
    async (_v3: () => unknown, v2: () => unknown) => v2(),
  );

  await RoutePage();

  expect(redirect).toHaveBeenCalledWith("./mini-app/permissions");
});
