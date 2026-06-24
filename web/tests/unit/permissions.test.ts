import { Role_Enum } from "@/graphql/graphql";
import {
  OWNER_ADMIN_MESSAGE,
  OWNER_ONLY_MESSAGE,
  PERMISSION_DISPLAY_GROUPS,
  PERMISSION_RULES,
  getTeamPermission,
  roleCanPerformAction,
} from "@/lib/team-permissions";

describe("team permission policy", () => {
  it("keeps the core edit actions Owner/Admin-only", () => {
    expect(PERMISSION_RULES.submit_app_for_review).toMatchObject({
      roles: [Role_Enum.Owner, Role_Enum.Admin],
      message: OWNER_ADMIN_MESSAGE,
    });
    expect(PERMISSION_RULES.edit_app_information).toMatchObject({
      roles: [Role_Enum.Owner, Role_Enum.Admin],
      message: OWNER_ADMIN_MESSAGE,
    });
    expect(PERMISSION_RULES.create_world_id_action).toMatchObject({
      roles: [Role_Enum.Owner, Role_Enum.Admin],
      message: OWNER_ADMIN_MESSAGE,
    });
  });

  it("keeps member management Owner-only and feeds the permissions dialog", () => {
    expect(PERMISSION_RULES.edit_member_role).toMatchObject({
      roles: [Role_Enum.Owner],
      message: OWNER_ONLY_MESSAGE,
    });

    const dialogGroup = PERMISSION_DISPLAY_GROUPS.find(
      (group) => group.label === "Update team roles",
    );

    expect(dialogGroup?.roles).toBe(PERMISSION_RULES.edit_member_role.roles);
  });

  it("derives delete-app and API key dialog rows from PERMISSION_RULES", () => {
    const dialogExpectations: Array<{
      label: string;
      action: keyof typeof PERMISSION_RULES;
    }> = [
      { label: "Delete apps", action: "delete_app" },
      { label: "View API keys", action: "view_api_keys" },
      { label: "Create & Edit API keys", action: "edit_api_keys" },
      { label: "Delete API keys", action: "delete_api_keys" },
    ];

    for (const { label, action } of dialogExpectations) {
      const dialogGroup = PERMISSION_DISPLAY_GROUPS.find(
        (group) => group.label === label,
      );

      expect(dialogGroup?.roles).toBe(PERMISSION_RULES[action].roles);
    }
  });

  it("checks user permission from the central role rules", () => {
    expect(getTeamPermission(undefined, "team_1", "delete_app").allowed).toBe(
      false,
    );
  });

  it("keeps invite lifecycle actions consistent with invite_member", () => {
    expect(PERMISSION_RULES.resend_invite).toMatchObject({
      roles: PERMISSION_RULES.invite_member.roles,
      message: OWNER_ADMIN_MESSAGE,
    });
    expect(PERMISSION_RULES.cancel_invite).toMatchObject({
      roles: PERMISSION_RULES.invite_member.roles,
      message: OWNER_ADMIN_MESSAGE,
    });
    expect(roleCanPerformAction(Role_Enum.Admin, "resend_invite")).toBe(true);
    expect(roleCanPerformAction(Role_Enum.Admin, "cancel_invite")).toBe(true);
  });

  it("checks action permission from the central role rules", () => {
    expect(roleCanPerformAction(Role_Enum.Owner, "cancel_invite")).toBe(true);
    expect(roleCanPerformAction(Role_Enum.Admin, "cancel_invite")).toBe(true);
    expect(roleCanPerformAction(undefined, "cancel_invite")).toBe(false);
  });
});
