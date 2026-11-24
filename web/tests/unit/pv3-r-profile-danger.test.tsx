/** @jest-environment jsdom */
import "@testing-library/jest-dom";

const mockRedirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

import RoutePage from "../../app/(portal)/profile/danger/page";

it("redirects the legacy danger route to the consolidated profile", async () => {
  await RoutePage();

  expect(mockRedirect).toHaveBeenCalledWith("/profile");
});
