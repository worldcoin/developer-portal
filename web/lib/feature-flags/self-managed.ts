/**
 * Temporary product disable. Keep self-managed code paths intact so
 * re-enabling only requires flipping this gate.
 */
export const SELF_MANAGED_ENABLED = false;

export const SELF_MANAGED_DISABLED_MESSAGE =
  "Self-managed mode is currently unavailable.";

export const SELF_MANAGED_DISABLED_REASON = "Coming Soon";

export const isSelfManagedEnabled = (): boolean => SELF_MANAGED_ENABLED;
