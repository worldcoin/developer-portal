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
const onCloseProp = jest.fn();

const submitDelete = async () => {
  const view = render(
    <DeleteTeamDialog open onClose={onCloseProp} team={TEAM} />,
  );

  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "DELETE" },
  });

  const submit = screen.getByRole("button", { name: "Delete team" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
  return view;
};

beforeEach(() => {
  jest.clearAllMocks();
  mockDeleteTeam.mockResolvedValue({ success: true });
});

it("refreshes the sidebar and closes when teams remain", async () => {
  mockMemberships = [{ team: { id: "t2", name: "other" } }];

  await submitDelete();

  await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  expect(onCloseProp).toHaveBeenCalledWith(false);
  expect(mockPush).not.toHaveBeenCalled();
});

it("redirects to team creation without refreshing when the last team is deleted", async () => {
  mockMemberships = [];

  await submitDelete();

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/create-team"));
  expect(mockRefresh).not.toHaveBeenCalled();
});

it("still refreshes and closes when the dialog unmounts mid-delete", async () => {
  mockMemberships = [{ team: { id: "t2", name: "other" } }];

  const { unmount } = await submitDelete();
  unmount();

  await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
  expect(onCloseProp).toHaveBeenCalledWith(false);
});
