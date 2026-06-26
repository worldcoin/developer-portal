import { Role_Enum } from "@/graphql/graphql";
import {
  PERMISSION_REGISTRY,
  getPermission,
  permissionMessage,
  roleCanPerformAction,
} from "@/lib/permissions/policy";

describe("team permission registry", () => {
  it("keeps core edit actions Owner/Admin and destructive actions Owner-only", () => {
    expect(PERMISSION_REGISTRY.submit_app_for_review).toEqual([
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
    expect(PERMISSION_REGISTRY.edit_app_information).toEqual([
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
    expect(PERMISSION_REGISTRY.delete_app).toEqual([Role_Enum.Owner]);
    expect(PERMISSION_REGISTRY.edit_member_role).toEqual([Role_Enum.Owner]);
  });

  it("keeps cancel_invite Owner-only to match Hasura (Admins cannot cancel)", () => {
    // resend mirrors invite (Owner/Admin); cancel is the stricter Owner-only.
    expect(PERMISSION_REGISTRY.resend_invite).toEqual(
      PERMISSION_REGISTRY.invite_member,
    );
    expect(PERMISSION_REGISTRY.cancel_invite).toEqual([Role_Enum.Owner]);
    expect(roleCanPerformAction(Role_Enum.Admin, "resend_invite")).toBe(true);
    expect(roleCanPerformAction(Role_Enum.Admin, "cancel_invite")).toBe(false);
  });

  it("checks role permission from the registry", () => {
    expect(roleCanPerformAction(Role_Enum.Owner, "delete_app")).toBe(true);
    expect(roleCanPerformAction(Role_Enum.Admin, "delete_app")).toBe(false);
    expect(roleCanPerformAction(undefined, "delete_app")).toBe(false);
  });
});

describe("permissionMessage", () => {
  it("builds the message from the allowed roles", () => {
    expect(permissionMessage([Role_Enum.Owner])).toBe(
      "Only Owners can perform this action.",
    );
    expect(permissionMessage([Role_Enum.Owner, Role_Enum.Admin])).toBe(
      "Only Owners and Admins can perform this action.",
    );
  });

  it("formats three roles with an Oxford comma", () => {
    expect(
      permissionMessage([Role_Enum.Owner, Role_Enum.Admin, Role_Enum.Member]),
    ).toBe("Only Owners, Admins, and Members can perform this action.");
  });
});

describe("getPermission", () => {
  it("denies a user with no membership and derives the message from the registry", () => {
    const permission = getPermission(undefined, "team_1", "delete_app");

    expect(permission.allowed).toBe(false);
    expect(permission.message).toBe("Only Owners can perform this action.");
  });

  it("uses a caller-supplied message override when provided", () => {
    const override =
      "You need additional permissions to manage your team's settings.";
    const permission = getPermission(
      undefined,
      "team_1",
      "edit_team_settings",
      override,
    );

    expect(permission.message).toBe(override);
  });
});
