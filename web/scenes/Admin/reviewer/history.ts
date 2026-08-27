export const sortReviewEvents = <
  T extends { eventSequence: number; createdAt: string; id: string },
>(
  events: readonly T[],
): T[] =>
  [...events].sort(
    (left, right) =>
      right.eventSequence - left.eventSequence ||
      right.createdAt.localeCompare(left.createdAt) ||
      right.id.localeCompare(left.id),
  );

const eventLabels: Record<string, string> = {
  approved: "Approved",
  changes_requested: "Changes requested",
  checklist_updated: "Checklist updated",
  claim_expired: "Claim expired",
  claim_heartbeat: "Claim renewed",
  claim_released: "Claim released",
  claimed: "Claimed",
  notification_attempted: "Notification attempted",
  notification_dead_lettered: "Notification stopped",
  notification_delivered: "Notification delivered",
  notification_failed: "Notification failed",
  publication_check_failed: "Publication check failed",
  publication_check_pending: "Publication check pending",
  publication_check_succeeded: "Publication check passed",
  submitted: "Submitted",
  withdrawn: "Withdrawn",
};

export const getReviewEventLabel = (eventType: string) =>
  eventLabels[eventType] ??
  eventType
    .split("_")
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
