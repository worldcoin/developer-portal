/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Role_Enum } from "@/graphql/graphql";
import { TEAM_SETTINGS_TABS } from "@/lib/team-settings";
import { TeamSettingsPage } from "@/scenes/PortalV3/Teams/TeamId/Team/Settings/page";

// #region Mocks
const teamId = "team_cd7aa5f3c2a797a06e66eb6eefbf2f48";
let mockSession: unknown;
let mockUserLoading = false;

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: mockSession, isLoading: mockUserLoading }),
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: (
    user: {
      hasura?: {
        memberships?: Array<{ role: Role_Enum; team?: { id?: string } }>;
      };
    },
    requestedTeamId: string,
    roles: Role_Enum[],
  ) => {
    const membership = user?.hasura?.memberships?.find(
      (item) => item.team?.id === requestedTeamId,
    );

    return membership ? roles.includes(membership.role) : false;
  },
}));

jest.mock("next/navigation", () => ({
  useParams: () => ({ teamId }),
}));

const useQuery = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
}));

const queryResult = {
  loading: false,
  data: {
    team_by_pk: {
      id: teamId,
      name: "Test team",
      memberships: [{ user_id: "user_1" }],
    },
  },
  refetch: jest.fn(),
};

jest.mock("@/components/SizingWrapper", () => ({
  SizingWrapper: ({ children }: React.PropsWithChildren) => (
    <main>{children}</main>
  ),
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/sections/SettingsForm", () => ({
  TeamSettingsForm: () => <section aria-label="Team profile" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/sections/Members", () => ({
  Members: () => <section aria-label="Members" />,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys", () => ({
  ApiKeys: () => <section aria-label="API keys" />,
}));
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/McpSetup",
  () => ({
    McpSetup: () => <section aria-label="MCP setup" />,
  }),
);
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/sections/DangerZone", () => ({
  TeamDangerZone: () => <button type="button">Delete team</button>,
}));
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/sections/LeaveTeam", () => ({
  LeaveTeam: () => <button type="button">Leave team</button>,
}));
// #endregion

const sessionWithRole = (role: Role_Enum) => ({
  hasura: { memberships: [{ role, team: { id: teamId } }] },
});

describe("Team settings permissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserLoading = false;
    useQuery.mockReturnValue(queryResult);
  });

  it("mirrors the redesigned General layout while the team is loading", () => {
    mockSession = sessionWithRole(Role_Enum.Owner);
    useQuery.mockReturnValue({
      data: undefined,
      loading: true,
      refetch: jest.fn(),
    });

    const { container } = render(<TeamSettingsPage />);

    expect(
      screen.getByRole("heading", { name: "General", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Team name", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("MCP setup")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Danger zone", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading team settings",
    );
    expect(screen.queryByLabelText("Team profile")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".react-loading-skeleton")).toHaveLength(
      2,
    );
  });

  it.each([
    {
      role: Role_Enum.Owner,
      canDeleteTeam: true,
      canLeaveTeam: false,
    },
    {
      role: Role_Enum.Admin,
      canDeleteTeam: false,
      canLeaveTeam: true,
    },
    {
      role: Role_Enum.Member,
      canDeleteTeam: false,
      canLeaveTeam: true,
    },
  ])(
    "renders the allowed General controls for $role",
    ({ role, canDeleteTeam, canLeaveTeam }) => {
      mockSession = sessionWithRole(role);
      render(<TeamSettingsPage />);

      expect(screen.getByLabelText("Team profile")).toBeInTheDocument();
      expect(screen.getByLabelText("MCP setup")).toBeInTheDocument();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();

      if (canDeleteTeam) {
        expect(
          screen.getByRole("button", { name: "Delete team" }),
        ).toBeInTheDocument();
      } else {
        expect(
          screen.queryByRole("button", { name: "Delete team" }),
        ).not.toBeInTheDocument();
      }

      if (canLeaveTeam) {
        expect(
          screen.getByRole("button", { name: "Leave team" }),
        ).toBeInTheDocument();
      } else {
        expect(
          screen.queryByRole("button", { name: "Leave team" }),
        ).not.toBeInTheDocument();
      }
    },
  );

  it("renders the Members tab without mounting General or credentials", () => {
    mockSession = sessionWithRole(Role_Enum.Member);
    render(<TeamSettingsPage requestedTab={TEAM_SETTINGS_TABS.Members} />);

    expect(screen.getByLabelText("Members")).toBeInTheDocument();
    expect(screen.queryByLabelText("Team profile")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("API keys")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("MCP setup")).not.toBeInTheDocument();
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it.each([Role_Enum.Owner, Role_Enum.Admin])(
    "renders API Keys for %s",
    (role) => {
      mockSession = sessionWithRole(role);
      render(<TeamSettingsPage requestedTab={TEAM_SETTINGS_TABS.ApiKeys} />);

      expect(screen.getByLabelText("API keys")).toBeInTheDocument();
      expect(screen.queryByLabelText("MCP setup")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Team profile")).not.toBeInTheDocument();
    },
  );

  it("keeps the API Keys loading screen visible while access is resolving", () => {
    mockSession = undefined;
    mockUserLoading = true;

    render(<TeamSettingsPage requestedTab={TEAM_SETTINGS_TABS.ApiKeys} />);

    expect(
      screen.getByRole("heading", { name: "API Keys", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading API keys");
    expect(
      screen.queryByRole("heading", { name: "General", level: 1 }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Team profile")).not.toBeInTheDocument();
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it("falls back to General when a member requests credentials directly", () => {
    mockSession = sessionWithRole(Role_Enum.Member);
    render(<TeamSettingsPage requestedTab={TEAM_SETTINGS_TABS.ApiKeys} />);

    expect(screen.getByLabelText("Team profile")).toBeInTheDocument();
    expect(screen.getByLabelText("MCP setup")).toBeInTheDocument();
    expect(screen.queryByLabelText("API keys")).not.toBeInTheDocument();
  });
});
