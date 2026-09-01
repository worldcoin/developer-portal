/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// #region Mocks
const useQueryMock = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: {} }),
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: () => true,
}));

jest.mock("jotai", () => ({
  useAtom: () => [false, jest.fn()],
}));

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/Members/InviteTeamMemberDialog",
  () => ({
    inviteTeamMemberDialogAtom: {},
    InviteTeamMemberDialog: () => <div>Invite dialog</div>,
  }),
);

jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/sections/Members/List", () => ({
  List: () => <div>Loaded members list</div>,
}));
// #endregion

import { Members } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/Members";

// #region Initial loading state
describe("Members initial loading state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQueryMock.mockReturnValue({
      data: undefined,
      loading: true,
      client: { refetchQueries: jest.fn() },
    });
  });

  it("mirrors the redesigned members controls and card list", () => {
    const { container } = render(<Members teamId="team_loading" />);

    expect(
      screen.getByRole("heading", { name: "Members", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Invite member" }),
    ).toBeDisabled();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Loading members");
    expect(screen.queryByText("Loaded members list")).not.toBeInTheDocument();
    expect(screen.queryByText("Invite dialog")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".react-loading-skeleton")).toHaveLength(
      9,
    );
  });

  it("keeps resolved content mounted during a background refetch", () => {
    useQueryMock.mockReturnValue({
      data: { members: [], invites: [] },
      loading: true,
      client: { refetchQueries: jest.fn() },
    });

    render(<Members teamId="team_loading" />);

    expect(screen.getByText("Loaded members list")).toBeInTheDocument();
    expect(screen.getByText("Invite dialog")).toBeInTheDocument();
    expect(screen.queryByText("Loading members")).not.toBeInTheDocument();
  });
});
// #endregion
