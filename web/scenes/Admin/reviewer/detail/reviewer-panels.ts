export const REVIEWER_PANELS = ["review", "app-data", "activity"] as const;

export type ReviewerPanel = (typeof REVIEWER_PANELS)[number];

export const parseReviewerPanel = (value: string | null): ReviewerPanel =>
  REVIEWER_PANELS.includes(value as ReviewerPanel)
    ? (value as ReviewerPanel)
    : "review";

export const reviewerPanelLabel: Record<ReviewerPanel, string> = {
  review: "Review",
  "app-data": "App data",
  activity: "Activity",
};
