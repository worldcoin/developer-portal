/** @jest-environment jsdom */
import "@testing-library/jest-dom";

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/lib/urls", () => ({
  urls: {
    teamSettings: ({ team_id }: { team_id: string }) =>
      `/teams/${team_id}/settings`,
  },
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/danger/page";

const props = () => ({
  params: Promise.resolve({ teamId: "team_1" }),
});

beforeEach(() => jest.clearAllMocks());

it("redirects the legacy team-danger route to consolidated team settings", async () => {
  await RoutePage(props());
  expect(redirect).toHaveBeenCalledWith("/teams/team_1/settings");
});
