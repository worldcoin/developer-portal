import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { getUserTeamRole } from "@/lib/utils";

export type TeamPermission = {
  allowed: boolean;
  message: string;
};

// Every team-scoped action the UI can gate.
export type Permission =
  | "submit_app_for_review"
  | "create_app_draft"
  | "unsubmit_app"
  | "resolve_app_review"
  | "edit_app_information"
  | "edit_app_store_details"
  | "edit_app_imagery"
  | "delete_app"
  | "enable_world_id_4_0"
  | "manage_world_id_4_0"
  | "create_world_id_action"
  | "edit_world_id_action"
  | "delete_world_id_action"
  | "view_api_keys"
  | "edit_api_keys"
  | "delete_api_keys"
  | "edit_team_settings"
  | "delete_team"
  | "invite_member"
  | "edit_member_role"
  | "remove_member"
  | "resend_invite"
  | "cancel_invite";

/**
 * Single source of truth: which roles may perform each team-scoped action.
 * This mirrors the server-side (Hasura RLS) rules — client gating is UX only,
 * so these lists must stay in sync with the actual authorization boundary.
 */
export const PERMISSION_REGISTRY: Record<Permission, Role_Enum[]> = {
  submit_app_for_review: [Role_Enum.Owner, Role_Enum.Admin],
  create_app_draft: [Role_Enum.Owner, Role_Enum.Admin],
  unsubmit_app: [Role_Enum.Owner, Role_Enum.Admin],
  resolve_app_review: [Role_Enum.Owner, Role_Enum.Admin],
  edit_app_information: [Role_Enum.Owner, Role_Enum.Admin],
  edit_app_store_details: [Role_Enum.Owner, Role_Enum.Admin],
  edit_app_imagery: [Role_Enum.Owner, Role_Enum.Admin],
  delete_app: [Role_Enum.Owner],
  enable_world_id_4_0: [Role_Enum.Owner, Role_Enum.Admin],
  manage_world_id_4_0: [Role_Enum.Owner, Role_Enum.Admin],
  create_world_id_action: [Role_Enum.Owner, Role_Enum.Admin],
  edit_world_id_action: [Role_Enum.Owner, Role_Enum.Admin],
  delete_world_id_action: [Role_Enum.Owner, Role_Enum.Admin],
  view_api_keys: [Role_Enum.Owner, Role_Enum.Admin],
  edit_api_keys: [Role_Enum.Owner],
  delete_api_keys: [Role_Enum.Owner],
  edit_team_settings: [Role_Enum.Owner],
  delete_team: [Role_Enum.Owner],
  invite_member: [Role_Enum.Owner, Role_Enum.Admin],
  edit_member_role: [Role_Enum.Owner],
  remove_member: [Role_Enum.Owner],
  resend_invite: [Role_Enum.Owner, Role_Enum.Admin],
  cancel_invite: [Role_Enum.Owner],
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

export const getTeamPermission = (
  user: Auth0SessionUser["user"] | undefined,
  teamId: string,
  permission: Permission,
  message?: string,
): TeamPermission => ({
  allowed: userCanPerformAction(user, teamId, permission),
  // Default to the role-derived message; callers pass `message` to override
  // with surface-specific copy (e.g. "...manage your team's settings").
  message: message ?? permissionMessage(PERMISSION_REGISTRY[permission]),
});
