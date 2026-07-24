/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const push = jest.fn();
const refresh = jest.fn();
let pathname = "/teams/team_1/settings";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => pathname,
}));

const invalidate = jest.fn();
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({
    user: { hasura: { id: "usr_1" } },
    invalidate,
  }),
}));

const refetch = jest.fn();
jest.mock("@/scenes/common/me-query/client", () => ({
  useMeQuery: () => ({ refetch }),
}));

const deleteTeamServerSide = jest.fn();
jest.mock("@/scenes/common/common/DeleteTeamDialog/server", () => ({
  deleteTeamServerSide: (...args: unknown[]) => deleteTeamServerSide(...args),
}));

// Render the dialog contents without Headless UI's portal/transition machinery.
jest.mock("@/components/Dialog", () => ({
  Dialog: ({ children, open }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
}));
jest.mock("@/components/DialogOverlay", () => ({
  DialogOverlay: () => null,
}));
jest.mock("@/components/DialogPanel", () => ({
  DialogPanel: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
// #endregion

import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";

// #region Test Data
const team = { id: "team_1", name: "My team" };

const refetchResultWithMemberships = (count: number) => ({
  data: {
    user_by_pk: {
      id: "usr_1",
      memberships: Array.from({ length: count }, (_, i) => ({
        role: "OWNER",
        team: { id: `team_${i + 1}`, name: `Team ${i + 1}` },
      })),
    },
  },
});

const renderDialog = () =>
  render(<DeleteTeamDialog open onClose={jest.fn()} team={team} />);

const confirmAndSubmit = async () => {
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "DELETE" },
  });
  const submitButton = screen.getByRole("button", { name: "Delete team" });
  await waitFor(() => expect(submitButton).toBeEnabled());
  fireEvent.click(submitButton);
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  pathname = "/teams/team_1/settings";
  deleteTeamServerSide.mockResolvedValue({ success: true });
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});

// #region Post-delete navigation
describe("DeleteTeamDialog [post-delete navigation]", () => {
  it("deletes, refreshes the session, and navigates to create-team when no teams remain", async () => {
    refetch.mockResolvedValue(refetchResultWithMemberships(0));

    renderDialog();
    await confirmAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/create-team"));
    expect(deleteTeamServerSide).toHaveBeenCalledWith("team_1");
    expect(global.fetch).toHaveBeenCalledWith("/api/update-session", {
      method: "POST",
    });
    expect(invalidate).toHaveBeenCalled();
  });

  it("navigates to profile teams when other teams remain", async () => {
    refetch.mockResolvedValue(refetchResultWithMemberships(2));

    renderDialog();
    await confirmAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile/teams"));
  });

  it("refreshes the session-fed sidebar when already on the teams page", async () => {
    pathname = "/profile/teams";
    refetch.mockResolvedValue(refetchResultWithMemberships(2));

    renderDialog();
    await confirmAndSubmit();

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });

  it("still navigates when the session refresh fails", async () => {
    refetch.mockResolvedValue(refetchResultWithMemberships(0));
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));

    renderDialog();
    await confirmAndSubmit();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/create-team"));
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("does not navigate when the delete fails", async () => {
    deleteTeamServerSide.mockResolvedValue({ success: false, message: "nope" });

    renderDialog();
    await confirmAndSubmit();

    await waitFor(() => expect(deleteTeamServerSide).toHaveBeenCalled());
    expect(refetch).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Unmount race (team settings page revokes canWrite mid-flow)
describe("DeleteTeamDialog [unmounted before delete resolves]", () => {
  it("completes the redirect even after the dialog unmounts", async () => {
    let resolveRefetch!: (value: unknown) => void;
    refetch.mockReturnValue(
      new Promise((resolve) => {
        resolveRefetch = resolve;
      }),
    );

    const { unmount } = renderDialog();
    await confirmAndSubmit();

    await waitFor(() => expect(deleteTeamServerSide).toHaveBeenCalled());

    // The settings page unmounts the dialog once canWrite collapses — before the refetch resolves.
    unmount();
    resolveRefetch(refetchResultWithMemberships(0));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/create-team"));
  });
});
// #endregion
