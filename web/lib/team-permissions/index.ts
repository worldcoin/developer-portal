import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";

type PermissionRule = { roles: Role_Enum[]; message: string };

export type TeamPermission = {
  allowed: boolean;
  message: string;
};

export const OWNER_ADMIN_MESSAGE =
  "Only Owners and Admins can edit this section.";
export const OWNER_ONLY_MESSAGE = "Only Owners can edit this section.";
export const SELF_ROW_MESSAGE = "You cannot manage your own member row.";

const ownerAdmin = (): PermissionRule => ({
  roles: [Role_Enum.Owner, Role_Enum.Admin],
  message: OWNER_ADMIN_MESSAGE,
});

const ownerOnly = (): PermissionRule => ({
  roles: [Role_Enum.Owner],
  message: OWNER_ONLY_MESSAGE,
});

export const PERMISSION_RULES = {
  submit_app_for_review: ownerAdmin(),
  create_app_draft: ownerAdmin(),
  unsubmit_app: ownerAdmin(),
  resolve_app_review: ownerAdmin(),
  edit_app_information: ownerAdmin(),
  edit_app_store_details: ownerAdmin(),
  edit_app_imagery: ownerAdmin(),
  save_app_configuration: ownerAdmin(),
  enable_world_id_4_0: ownerAdmin(),
  manage_world_id_4_0: ownerAdmin(),
  create_world_id_action: ownerAdmin(),
  edit_world_id_action: ownerAdmin(),
  delete_world_id_action: ownerAdmin(),
  invite_member: ownerAdmin(),
  edit_member_role: ownerOnly(),
  remove_member: ownerOnly(),
  resend_invite: ownerOnly(),
  cancel_invite: ownerOnly(),
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
  { label: "Delete apps", roles: [Role_Enum.Owner] },
  { label: "View app configuration", roles: allTeamRoles },
  {
    label: "Create & Edit app configuration",
    roles: rolesFor("edit_app_store_details"),
  },
  { label: "View API keys", roles: [Role_Enum.Owner, Role_Enum.Admin] },
  { label: "Create & Edit API keys", roles: [Role_Enum.Owner] },
  { label: "Delete API keys", roles: [Role_Enum.Owner] },
  { label: "View team members & roles", roles: allTeamRoles },
  { label: "Invite team members", roles: rolesFor("invite_member") },
  { label: "Remove team members", roles: rolesFor("remove_member") },
  { label: "Update team roles", roles: rolesFor("edit_member_role") },
];

export const roleHasPermission = (
  group: PermissionDisplayGroup,
  role: Role_Enum,
) => group.roles.includes(role);

export const getTeamPermission = (
  user: Auth0SessionUser["user"] | undefined,
  teamId: string,
  action: PermissionAction,
): TeamPermission => {
  const rule = PERMISSION_RULES[action];

  return {
    allowed: checkUserPermissions(user, teamId, rule.roles),
    message: rule.message,
  };
};
