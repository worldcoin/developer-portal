/** @jest-environment jsdom */
import "@testing-library/jest-dom";

const redirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

jest.mock("@/lib/urls", () => ({
  urls: {
    teamSettings: ({ team_id, tab }: { team_id: string; tab?: string }) =>
      `/teams/${team_id}/settings${tab ? `?tab=${tab}` : ""}`,
  },
}));
import RoutePage from "../../app/(portal)/teams/[teamId]/(team)/api-keys/page";

const props = () => ({
  params: Promise.resolve({ teamId: "team_1" }),
});

beforeEach(() => jest.clearAllMocks());

it("redirects the legacy api-keys route to consolidated team settings", async () => {
  await RoutePage(props());
  expect(redirect).toHaveBeenCalledWith("/teams/team_1/settings?tab=api-keys");
});
