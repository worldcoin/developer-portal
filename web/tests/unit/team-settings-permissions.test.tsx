/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Role_Enum } from "@/graphql/graphql";
import { TeamSettingsPage } from "@/scenes/PortalV3/Teams/TeamId/Team/Settings/page";

// #region Mocks
const teamId = "team_cd7aa5f3c2a797a06e66eb6eefbf2f48";
let mockSession: unknown;

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: mockSession }),
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

jest.mock("@apollo/client/react", () => ({
  useQuery: () => ({
    data: {
      team_by_pk: {
        id: teamId,
        name: "Test team",
        memberships: [],
      },
    },
    refetch: jest.fn(),
  }),
}));

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
// #endregion

const sessionWithRole = (role: Role_Enum) => ({
  hasura: { memberships: [{ role, team: { id: teamId } }] },
});

describe("Team settings permissions", () => {
  it.each([
    {
      role: Role_Enum.Owner,
      canViewCredentials: true,
      canDeleteTeam: true,
    },
    {
      role: Role_Enum.Admin,
      canViewCredentials: true,
      canDeleteTeam: false,
    },
    {
      role: Role_Enum.Member,
      canViewCredentials: false,
      canDeleteTeam: false,
    },
  ])(
    "renders the allowed controls for $role",
    ({ role, canViewCredentials, canDeleteTeam }) => {
      mockSession = sessionWithRole(role);
      render(<TeamSettingsPage />);

      expect(screen.getByLabelText("Members")).toBeInTheDocument();

      if (canViewCredentials) {
        expect(screen.getByLabelText("API keys")).toBeInTheDocument();
        expect(screen.getByLabelText("MCP setup")).toBeInTheDocument();
      } else {
        expect(screen.queryByLabelText("API keys")).not.toBeInTheDocument();
        expect(screen.queryByLabelText("MCP setup")).not.toBeInTheDocument();
      }

      if (canDeleteTeam) {
        expect(
          screen.getByRole("button", { name: "Delete team" }),
        ).toBeInTheDocument();
      } else {
        expect(
          screen.queryByRole("button", { name: "Delete team" }),
        ).not.toBeInTheDocument();
      }
    },
  );
});
