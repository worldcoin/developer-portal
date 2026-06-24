/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { Role_Enum } from "@/graphql/graphql";
import { useTeamPermission } from "@/lib/team-permissions/use-team-permission";

const useUserMock = jest.fn();

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => useUserMock(),
}));

jest.mock("@/lib/utils", () => ({
  checkUserPermissions: (
    user: {
      hasura?: {
        memberships?: Array<{ role?: string; team?: { id?: string } }>;
      };
    },
    teamId: string,
    roles: string[],
  ) => {
    const membership = user?.hasura?.memberships?.find(
      (item) => item.team?.id === teamId,
    );

    return Boolean(membership?.role && roles.includes(membership.role));
  },
}));

const userWithRole = (role: Role_Enum) => ({
  user: {
    hasura: {
      memberships: [{ role, team: { id: "team_1" } }],
    },
  },
});

describe("useTeamPermission", () => {
  it("allows Owners on Owner/Admin actions", () => {
    useUserMock.mockReturnValue(userWithRole(Role_Enum.Owner));

    const { result } = renderHook(() =>
      useTeamPermission("team_1", "submit_app_for_review"),
    );

    expect(result.current.allowed).toBe(true);
  });

  it("fails closed with the rule message when the user lacks the role", () => {
    useUserMock.mockReturnValue(userWithRole(Role_Enum.Member));

    const { result } = renderHook(() =>
      useTeamPermission("team_1", "submit_app_for_review"),
    );

    expect(result.current).toEqual({
      allowed: false,
      message: "Only Owners and Admins can edit this section.",
    });
  });
});
