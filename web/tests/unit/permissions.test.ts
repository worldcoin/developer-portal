import { Role_Enum } from "@/graphql/graphql";
import {
  OWNER_ADMIN_MESSAGE,
  OWNER_ONLY_MESSAGE,
  PERMISSION_DISPLAY_GROUPS,
  PERMISSION_RULES,
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
});
