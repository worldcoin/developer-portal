/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  usePathname: () => "/profile/teams",
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: { hasura: { id: "usr_1" } }, invalidate: jest.fn() }),
}));

const mockDeleteTeam = jest.fn();
jest.mock("@/scenes/common/common/DeleteTeamDialog/server", () => ({
  deleteTeamServerSide: (...args: unknown[]) => mockDeleteTeam(...args),
}));

let mockMemberships: { team: { id: string; name: string } }[] = [];
jest.mock("@/scenes/common/me-query/client", () => ({
  useMeQuery: () => ({
    user: { memberships: mockMemberships },
    loading: false,
    refetch: () =>
      Promise.resolve({
        data: { user_by_pk: { memberships: mockMemberships } },
      }),
  }),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";

const TEAM = { id: "7f0e2a4c-9d31-4b8e-a5f6-1c2d3e4f5a6b", name: "doomed" };

let sessionSynced = false;

const deleteViaDialog = async () => {
  render(<DeleteTeamDialog open onClose={jest.fn()} team={TEAM} />);

  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "DELETE" },
  });

  const submit = screen.getByRole("button", { name: "Delete team" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
};

beforeEach(() => {
  jest.clearAllMocks();
  sessionSynced = false;
  global.fetch = jest.fn(async () => {
    sessionSynced = true;
    return { ok: true } as Response;
  }) as unknown as typeof fetch;
  mockDeleteTeam.mockResolvedValue({ success: true });
});

it("refreshes the router only after the session cookie sync completes", async () => {
  mockMemberships = [{ team: { id: "t2", name: "other" } }];
  let refreshedAfterSync = false;
  mockRefresh.mockImplementation(() => {
    refreshedAfterSync = sessionSynced;
  });

  await deleteViaDialog();

  await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  expect(global.fetch).toHaveBeenCalledWith("/api/update-session", {
    method: "POST",
  });
  expect(refreshedAfterSync).toBe(true);
  expect(mockPush).not.toHaveBeenCalled();
});

it("skips the refresh when the last team is deleted and redirects instead", async () => {
  mockMemberships = [];

  await deleteViaDialog();

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/create-team"));
  expect(mockRefresh).not.toHaveBeenCalled();
});
