import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { getUserTeamRole } from "@/lib/utils";

type PermissionRule = { roles: Role_Enum[]; message: string };

export type TeamPermission = {
  allowed: boolean;
  message: string;
};

export const OWNER_ADMIN_MESSAGE =
  "Only Owners and Admins can edit this section.";
export const OWNER_ONLY_MESSAGE = "Only Owners can edit this section.";

const OWNER_ADMIN: PermissionRule = {
  roles: [Role_Enum.Owner, Role_Enum.Admin],
  message: OWNER_ADMIN_MESSAGE,
};

const OWNER_ONLY: PermissionRule = {
  roles: [Role_Enum.Owner],
  message: OWNER_ONLY_MESSAGE,
};

export const PERMISSION_RULES = {
  submit_app_for_review: OWNER_ADMIN,
  create_app_draft: OWNER_ADMIN,
  unsubmit_app: OWNER_ADMIN,
  resolve_app_review: OWNER_ADMIN,
  edit_app_information: OWNER_ADMIN,
  edit_app_store_details: OWNER_ADMIN,
  edit_app_imagery: OWNER_ADMIN,
  delete_app: OWNER_ONLY,
  enable_world_id_4_0: OWNER_ADMIN,
  manage_world_id_4_0: OWNER_ADMIN,
  create_world_id_action: OWNER_ADMIN,
  edit_world_id_action: OWNER_ADMIN,
  delete_world_id_action: OWNER_ADMIN,
  view_api_keys: OWNER_ADMIN,
  edit_api_keys: OWNER_ONLY,
  delete_api_keys: OWNER_ONLY,
  edit_team_settings: OWNER_ONLY,
  delete_team: OWNER_ONLY,
  invite_member: OWNER_ADMIN,
  edit_member_role: OWNER_ONLY,
  remove_member: OWNER_ONLY,
  resend_invite: OWNER_ADMIN,
  cancel_invite: OWNER_ONLY,
} satisfies Record<string, PermissionRule>;

export type PermissionAction = keyof typeof PERMISSION_RULES;

export const roleCanPerformAction = (
  role: Role_Enum | undefined,
  action: PermissionAction,
): boolean => {
  return Boolean(role && PERMISSION_RULES[action].roles.includes(role));
};

export const userCanPerformAction = (
  user: Auth0SessionUser["user"] | undefined,
  teamId: string,
  action: PermissionAction,
): boolean => roleCanPerformAction(getUserTeamRole(user, teamId), action);

export const getTeamPermission = (
  user: Auth0SessionUser["user"] | undefined,
  teamId: string,
  action: PermissionAction,
): TeamPermission => {
  const rule = PERMISSION_RULES[action];

  return {
    allowed: userCanPerformAction(user, teamId, action),
    message: rule.message,
  };
};
