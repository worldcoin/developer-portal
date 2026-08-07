/** @jest-environment jsdom */
import "@testing-library/jest-dom";
// #region Mocks
const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/lib/urls", () => ({
  urls: { dashboard: () => "/dashboard" },
}));
// #endregion

import RoutePage from "../../app/(portal)/teams/page";

beforeEach(() => jest.clearAllMocks());

it("sends the teams index through the latest-team dashboard resolver", async () => {
  await RoutePage();

  expect(redirect).toHaveBeenCalledWith("/dashboard");
});
