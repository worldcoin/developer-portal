import {
  PERMISSION_RULES,
  SELF_ROW_MESSAGE,
  type PermissionAction,
} from "@/lib/team-permissions";

export type MemberRowAction = {
  key: "edit_member_role" | "remove_member" | "resend_invite" | "cancel_invite";
  label: string;
  danger: boolean;
  allowed: boolean;
  reason: string | null;
};

const reasonFor = (params: {
  action: PermissionAction;
  isOwner: boolean;
  isCurrent: boolean;
}) => {
  if (!params.isOwner) {
    return PERMISSION_RULES[params.action].message;
  }

  if (params.isCurrent) {
    return SELF_ROW_MESSAGE;
  }

  return null;
};

export const getMemberRowActions = (params: {
  isOwner: boolean;
  isCurrent: boolean;
  isInviteRow: boolean;
}): MemberRowAction[] => {
  const { isOwner, isCurrent, isInviteRow } = params;
  const allowed = isOwner && !isCurrent;

  if (isInviteRow) {
    return [
      {
        key: "resend_invite",
        label: "Re-send invite",
        danger: false,
        allowed,
        reason: reasonFor({
          action: "resend_invite",
          isOwner,
          isCurrent,
        }),
      },
      {
        key: "cancel_invite",
        label: "Cancel invite",
        danger: true,
        allowed,
        reason: reasonFor({
          action: "cancel_invite",
          isOwner,
          isCurrent,
        }),
      },
    ];
  }

  return [
    {
      key: "edit_member_role",
      label: "Edit role",
      danger: false,
      allowed,
      reason: reasonFor({
        action: "edit_member_role",
        isOwner,
        isCurrent,
      }),
    },
    {
      key: "remove_member",
      label: "Remove member",
      danger: true,
      allowed,
      reason: reasonFor({
        action: "remove_member",
        isOwner,
        isCurrent,
      }),
    },
  ];
};
