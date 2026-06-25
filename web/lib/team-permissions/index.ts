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
export const SELF_ROW_MESSAGE = "You cannot manage your own member row.";

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

export const TEAM_PERMISSION_ROLES = [
  { label: "Owner", value: Role_Enum.Owner },
  { label: "Admin", value: Role_Enum.Admin },
  { label: "Member", value: Role_Enum.Member },
] as const;

export type PermissionDisplayGroup = {
  label: string;
  roles: Role_Enum[];
};

const allTeamRoles = TEAM_PERMISSION_ROLES.map((role) => role.value);
const rolesFor = (action: PermissionAction): Role_Enum[] =>
  PERMISSION_RULES[action].roles;

export const PERMISSION_DISPLAY_GROUPS: PermissionDisplayGroup[] = [
  { label: "View World ID", roles: allTeamRoles },
  {
    label: "Enable & Manage World ID 4.0",
    roles: rolesFor("enable_world_id_4_0"),
  },
  { label: "View World ID actions", roles: allTeamRoles },
  {
    label: "Create & Edit World ID actions",
    roles: rolesFor("create_world_id_action"),
  },
  {
    label: "Delete World ID actions",
    roles: rolesFor("delete_world_id_action"),
  },
  { label: "View apps", roles: allTeamRoles },
  {
    label: "Create & Edit apps",
    roles: rolesFor("edit_app_information"),
  },
  { label: "Delete apps", roles: rolesFor("delete_app") },
  { label: "View app configuration", roles: allTeamRoles },
  {
    label: "Create & Edit app configuration",
    roles: rolesFor("edit_app_store_details"),
  },
  { label: "View API keys", roles: rolesFor("view_api_keys") },
  { label: "Create & Edit API keys", roles: rolesFor("edit_api_keys") },
  { label: "Delete API keys", roles: rolesFor("delete_api_keys") },
  { label: "View team members & roles", roles: allTeamRoles },
  { label: "Invite team members", roles: rolesFor("invite_member") },
  { label: "Remove team members", roles: rolesFor("remove_member") },
  { label: "Update team roles", roles: rolesFor("edit_member_role") },
];

export const roleHasPermission = (
  group: PermissionDisplayGroup,
  role: Role_Enum,
) => group.roles.includes(role);

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
