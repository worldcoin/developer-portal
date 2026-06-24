import { getMemberRowActions } from "@/scenes/Portal/Teams/TeamId/Team/page/Members/List/member-row-actions";

describe("getMemberRowActions", () => {
  it("switches between member and invite actions", () => {
    expect(
      getMemberRowActions({
        isOwner: true,
        isCurrent: false,
        isInviteRow: false,
      }).map((action) => action.key),
    ).toEqual(["edit_member_role", "remove_member"]);

    expect(
      getMemberRowActions({
        isOwner: true,
        isCurrent: false,
        isInviteRow: true,
      }).map((action) => action.key),
    ).toEqual(["resend_invite", "cancel_invite"]);
  });

  it("uses Owner-only copy before self-row copy for non-owners", () => {
    const actions = getMemberRowActions({
      isOwner: false,
      isCurrent: true,
      isInviteRow: false,
    });

    expect(actions.every((action) => action.allowed === false)).toBe(true);
    expect(
      actions.every(
        (action) => action.reason === "Only Owners can edit this section.",
      ),
    ).toBe(true);
  });
});
