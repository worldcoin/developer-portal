import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { getUserTeamRole } from "@/lib/utils";
import { PERMISSION_REGISTRY, type Permission } from "@/lib/permissions/policy";

export type PermissionResult = {
  allowed: boolean;
  message: string;
};

// Pluralized display labels used to build permission messages.
const ROLE_LABELS: Record<Role_Enum, string> = {
  [Role_Enum.Owner]: "Owners",
  [Role_Enum.Admin]: "Admins",
  [Role_Enum.Member]: "Members",
};

const roleList = new Intl.ListFormat("en", {
  style: "long",
  type: "conjunction",
});

/**
 * Builds the disable-not-hide message from the allowed roles, so the copy
 * always tracks the policy and scales when a role is added:
 *   [Owner]                -> "Only Owners can perform this action."
 *   [Owner, Admin]         -> "Only Owners and Admins can perform this action."
 *   [Owner, Admin, Member] -> "Only Owners, Admins, and Members can perform this action."
 */
export const permissionMessage = (roles: Role_Enum[]): string =>
  `Only ${roleList.format(roles.map((role) => ROLE_LABELS[role]))} can perform this action.`;

export const roleCanPerformAction = (
  role: Role_Enum | undefined,
  permission: Permission,
): boolean => Boolean(role && PERMISSION_REGISTRY[permission].includes(role));

export const userCanPerformAction = (
  user: Auth0SessionUser["user"] | undefined,
  teamId: string,
  permission: Permission,
): boolean => roleCanPerformAction(getUserTeamRole(user, teamId), permission);

export const getPermission = (
  user: Auth0SessionUser["user"] | undefined,
  teamId: string,
  permission: Permission,
  message?: string,
): PermissionResult => ({
  allowed: userCanPerformAction(user, teamId, permission),
  // Default to the role-derived message; callers pass `message` to override
  // with surface-specific copy (e.g. "...manage your team's settings").
  message: message ?? permissionMessage(PERMISSION_REGISTRY[permission]),
});
