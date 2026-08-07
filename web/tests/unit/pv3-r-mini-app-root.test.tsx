/** @jest-environment jsdom */
import "@testing-library/jest-dom";

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import RoutePage from "../../app/(portal)/teams/[teamId]/apps/[appId]/mini-app/page";

it("redirects the mini app root to Develop", async () => {
  await RoutePage();

  expect(redirect).toHaveBeenCalledWith("./develop");
});
