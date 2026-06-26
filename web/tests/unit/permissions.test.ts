import { Role_Enum } from "@/graphql/graphql";
import {
  OWNER_ADMIN_MESSAGE,
  OWNER_ONLY_MESSAGE,
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

  it("keeps member management Owner-only", () => {
    expect(PERMISSION_RULES.edit_member_role).toMatchObject({
      roles: [Role_Enum.Owner],
      message: OWNER_ONLY_MESSAGE,
    });
  });

  it("checks user permission from the central role rules", () => {
    expect(getTeamPermission(undefined, "team_1", "delete_app").allowed).toBe(
      false,
    );
  });

  it("keeps invite lifecycle actions on the right roles", () => {
    // resend_invite mirrors invite_member (Owner/Admin)
    expect(PERMISSION_RULES.resend_invite).toMatchObject({
      roles: PERMISSION_RULES.invite_member.roles,
      message: OWNER_ADMIN_MESSAGE,
    });
    // cancel_invite is the stricter Owner-only action
    expect(PERMISSION_RULES.cancel_invite).toMatchObject({
      roles: [Role_Enum.Owner],
      message: OWNER_ONLY_MESSAGE,
    });
    expect(roleCanPerformAction(Role_Enum.Admin, "resend_invite")).toBe(true);
    expect(roleCanPerformAction(Role_Enum.Admin, "cancel_invite")).toBe(false);
  });

  it("checks action permission from the central role rules", () => {
    expect(roleCanPerformAction(Role_Enum.Owner, "cancel_invite")).toBe(true);
    expect(roleCanPerformAction(Role_Enum.Admin, "cancel_invite")).toBe(false);
    expect(roleCanPerformAction(undefined, "cancel_invite")).toBe(false);
  });
});
