import type { ActionRestriction } from "@/components/RestrictedAction";

type RpAction = "retry" | "manage_registered_rp";

type GetRpActionRestrictionParams = {
  action: RpAction;
  permission: ActionRestriction;
  mode: string;
  isActive: boolean;
};

export const getRpActionRestriction = ({
  action,
  permission,
  mode,
  isActive,
}: GetRpActionRestrictionParams): ActionRestriction => {
  if (!permission.allowed) {
    return permission;
  }

  if (mode === "self_managed") {
    return {
      allowed: false,
      message: "This RP is self-managed.",
    };
  }

  if (action === "manage_registered_rp" && !isActive) {
    return {
      allowed: false,
      message: "RP must be active to reset or switch modes.",
    };
  }

  return permission;
};
