import { Role_Enum } from "@/graphql/graphql";
import { getMemberRowActions } from "@/scenes/Portal/Teams/TeamId/Team/page/Members/List/member-row-actions";

describe("getMemberRowActions", () => {
  it("allows Owners to manage other member rows", () => {
    const actions = getMemberRowActions({
      userRole: Role_Enum.Owner,
      isCurrent: false,
      isInviteRow: false,
    });

    expect(actions.map((action) => action.key)).toEqual([
      "edit_member_role",
      "remove_member",
    ]);
    expect(actions.every((action) => action.allowed)).toBe(true);
    expect(actions.every((action) => action.reason === null)).toBe(true);
  });

  it("allows Admins to manage invite rows", () => {
    const actions = getMemberRowActions({
      userRole: Role_Enum.Admin,
      isCurrent: false,
      isInviteRow: true,
    });

    expect(actions.map((action) => action.key)).toEqual([
      "resend_invite",
      "cancel_invite",
    ]);
    expect(actions.every((action) => action.allowed)).toBe(true);
    expect(actions.every((action) => action.reason === null)).toBe(true);
  });

  it("blocks Admins from Owner-only member row actions", () => {
    const actions = getMemberRowActions({
      userRole: Role_Enum.Admin,
      isCurrent: false,
      isInviteRow: false,
    });

    expect(actions.every((action) => action.allowed === false)).toBe(true);
    expect(
      actions.every(
        (action) => action.reason === "Only Owners can edit this section.",
      ),
    ).toBe(true);
  });

  it("uses the self-row reason only after role permission passes", () => {
    const ownerActions = getMemberRowActions({
      userRole: Role_Enum.Owner,
      isCurrent: true,
      isInviteRow: false,
    });
    const memberActions = getMemberRowActions({
      userRole: Role_Enum.Member,
      isCurrent: true,
      isInviteRow: false,
    });

    expect(ownerActions.every((action) => action.allowed === false)).toBe(true);
    expect(
      ownerActions.every(
        (action) => action.reason === "You cannot manage your own member row.",
      ),
    ).toBe(true);
    expect(
      memberActions.every(
        (action) => action.reason === "Only Owners can edit this section.",
      ),
    ).toBe(true);
  });
});
