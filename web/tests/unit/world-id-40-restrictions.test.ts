import { getRpActionRestriction } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page/rp-action-restrictions";

const allowed = {
  allowed: true,
  message: "Only Owners and Admins can edit this section.",
};

const blocked = {
  allowed: false,
  message: "Only Owners and Admins can edit this section.",
};

describe("getRpActionRestriction", () => {
  it("preserves permission failures before RP state checks", () => {
    expect(
      getRpActionRestriction({
        action: "manage_registered_rp",
        permission: blocked,
        mode: "self_managed",
        isActive: false,
      }),
    ).toBe(blocked);
  });

  it("blocks self-managed retries before dispatching to the server", () => {
    expect(
      getRpActionRestriction({
        action: "retry",
        permission: allowed,
        mode: "self_managed",
        isActive: true,
      }),
    ).toEqual({
      allowed: false,
      message: "This RP is self-managed.",
    });
  });

  it("requires active managed RPs for reset and switch", () => {
    expect(
      getRpActionRestriction({
        action: "manage_registered_rp",
        permission: allowed,
        mode: "managed",
        isActive: false,
      }),
    ).toEqual({
      allowed: false,
      message: "RP must be active to reset or switch modes.",
    });
  });
});
