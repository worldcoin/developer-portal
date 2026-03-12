import {
  isSelfManagedEnabled,
  SELF_MANAGED_DISABLED_MESSAGE,
  SELF_MANAGED_DISABLED_REASON,
} from "@/lib/feature-flags";

describe("self-managed feature gate", () => {
  test("is disabled by default", () => {
    expect(isSelfManagedEnabled()).toBe(false);
  });

  test("exposes a stable disabled reason", () => {
    expect(SELF_MANAGED_DISABLED_REASON).toBe("Coming Soon");
    expect(SELF_MANAGED_DISABLED_MESSAGE).toBe(
      "Self-managed mode is currently unavailable.",
    );
  });
});
