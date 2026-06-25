import { Role_Enum } from "@/graphql/graphql";
import {
  PERMISSION_RULES,
  roleCanPerformAction,
  SELF_ROW_MESSAGE,
} from "@/lib/team-permissions";

export type MemberRowAction = {
  key: "edit_member_role" | "remove_member" | "resend_invite" | "cancel_invite";
  label: string;
  danger: boolean;
  allowed: boolean;
  reason: string | null;
};

const buildAction = (
  key: MemberRowAction["key"],
  label: string,
  danger: boolean,
  userRole: Role_Enum | undefined,
  isCurrent: boolean,
): MemberRowAction => {
  const hasRolePermission = roleCanPerformAction(userRole, key);

  const reason = !hasRolePermission
    ? PERMISSION_RULES[key].message
    : isCurrent
      ? SELF_ROW_MESSAGE
      : null;

  return {
    key,
    label,
    danger,
    allowed: hasRolePermission && !isCurrent,
    reason,
  };
};

export const getMemberRowActions = (params: {
  userRole: Role_Enum | undefined;
  isCurrent: boolean;
  isInviteRow: boolean;
}): MemberRowAction[] => {
  const { userRole, isCurrent, isInviteRow } = params;

  if (isInviteRow) {
    return [
      buildAction(
        "resend_invite",
        "Re-send invite",
        false,
        userRole,
        isCurrent,
      ),
      buildAction("cancel_invite", "Cancel invite", true, userRole, isCurrent),
    ];
  }

  return [
    buildAction("edit_member_role", "Edit role", false, userRole, isCurrent),
    buildAction("remove_member", "Remove member", true, userRole, isCurrent),
  ];
};
