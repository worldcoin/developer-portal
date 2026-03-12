import MiniAppPage from "@/app/(portal)/teams/[teamId]/apps/[appId]/mini-app/page";
import LegacyNotificationsPage from "@/app/(portal)/teams/[teamId]/apps/[appId]/notifications/page";
import LegacyTransactionsPage from "@/app/(portal)/teams/[teamId]/apps/[appId]/transactions/page";

const redirect = jest.fn();

jest.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

describe("legacy mini app redirects", () => {
  beforeEach(() => {
    redirect.mockReset();
  });

  it("redirects mini app root to permissions and preserves explicit version", async () => {
    await MiniAppPage({
      params: { teamId: "team_123", appId: "app_123" },
      searchParams: { version: "approved" },
    });

    expect(redirect).toHaveBeenCalledWith(
      "/teams/team_123/apps/app_123/mini-app/permissions?version=approved",
    );
  });

  it("redirects transactions route to mini app transactions without stale version", async () => {
    await LegacyTransactionsPage({
      params: { teamId: "team_123", appId: "app_123" },
      searchParams: { version: "stale" },
    });

    expect(redirect).toHaveBeenCalledWith(
      "/teams/team_123/apps/app_123/mini-app/transactions",
    );
  });

  it("redirects notifications route to mini app notifications", async () => {
    await LegacyNotificationsPage({
      params: { teamId: "team_123", appId: "app_123" },
      searchParams: undefined,
    });

    expect(redirect).toHaveBeenCalledWith(
      "/teams/team_123/apps/app_123/mini-app/notifications",
    );
  });
});
