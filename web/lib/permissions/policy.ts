import { Role_Enum } from "@/graphql/graphql";

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
 *
 * Data only — no logic. The evaluator (can-this-user-do-X + message building)
 * lives in ./get-permission; the server-side enforcement lives in ./index.
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
