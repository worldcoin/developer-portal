import type { ReviewerQueueRow } from "./types";

export const reviewerQueueStatuses = [
  "pending",
  "mine",
  "in_review",
  "changes_requested",
  "approved",
  "all",
] as const;

export const reviewerQueueAges = [
  "all",
  "over-1d",
  "over-3d",
  "over-7d",
  "over-30d",
] as const;

export type ReviewerQueueFilters = {
  age: (typeof reviewerQueueAges)[number];
  assignee: string;
  mode: "all" | "mini-app" | "external";
  page: number;
  status: (typeof reviewerQueueStatuses)[number];
  team: string;
};

const MAX_QUEUE_PAGE = 1_000_000;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const isOneOf = <T extends string>(
  value: string | undefined,
  choices: readonly T[],
): value is T => Boolean(value && choices.includes(value as T));

export const parseReviewerQueueFilters = (
  params: SearchParams,
): ReviewerQueueFilters => {
  const age = first(params.age);
  const mode = first(params.mode);
  const status = first(params.status);

  return {
    age: isOneOf(age, reviewerQueueAges) ? age : "all",
    assignee: first(params.assignee)?.trim().slice(0, 200) ?? "",
    mode: mode === "mini-app" || mode === "external" ? mode : ("all" as const),
    page: Math.min(
      MAX_QUEUE_PAGE,
      Math.max(1, Number.parseInt(first(params.page) ?? "1", 10) || 1),
    ),
    status: isOneOf(status, reviewerQueueStatuses) ? status : "pending",
    team: first(params.team)?.trim().slice(0, 200) ?? "",
  };
};

const ageThresholdMs: Partial<Record<ReviewerQueueFilters["age"], number>> = {
  "over-1d": 24 * 60 * 60 * 1000,
  "over-3d": 3 * 24 * 60 * 60 * 1000,
  "over-7d": 7 * 24 * 60 * 60 * 1000,
  "over-30d": 30 * 24 * 60 * 60 * 1000,
};

export const applyReviewerQueueFilters = <
  T extends Pick<
    ReviewerQueueRow,
    | "id"
    | "status"
    | "appMode"
    | "teamId"
    | "teamName"
    | "submittedAt"
    | "claimedByEmail"
    | "claimExpiresAt"
  >,
>(
  submissions: readonly T[],
  filters: ReviewerQueueFilters,
  reviewerEmail: string,
  now = new Date(),
): T[] => {
  const teamQuery = filters.team.toLocaleLowerCase();
  const assigneeQuery = filters.assignee.toLocaleLowerCase();
  const oldestAllowedMs = ageThresholdMs[filters.age];

  return submissions
    .filter((submission) => {
      const claimExpiresAt = submission.claimExpiresAt
        ? Date.parse(submission.claimExpiresAt)
        : Number.NaN;
      const hasExpiredClaim =
        submission.status === "in_review" &&
        Number.isFinite(claimExpiresAt) &&
        claimExpiresAt <= now.getTime();

      if (filters.status === "mine") {
        if (
          submission.status !== "in_review" ||
          hasExpiredClaim ||
          submission.claimedByEmail?.toLocaleLowerCase() !==
            reviewerEmail.toLocaleLowerCase()
        ) {
          return false;
        }
      } else if (filters.status === "pending") {
        if (submission.status !== "pending" && !hasExpiredClaim) return false;
      } else if (
        filters.status !== "all" &&
        (submission.status !== filters.status ||
          (filters.status === "in_review" && hasExpiredClaim))
      ) {
        return false;
      }

      if (filters.mode !== "all" && submission.appMode !== filters.mode) {
        return false;
      }

      if (
        teamQuery &&
        !submission.teamId.toLocaleLowerCase().includes(teamQuery) &&
        !submission.teamName.toLocaleLowerCase().includes(teamQuery)
      ) {
        return false;
      }

      if (
        assigneeQuery &&
        !submission.claimedByEmail?.toLocaleLowerCase().includes(assigneeQuery)
      ) {
        return false;
      }

      if (
        oldestAllowedMs &&
        now.getTime() - new Date(submission.submittedAt).getTime() <
          oldestAllowedMs
      ) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        left.submittedAt.localeCompare(right.submittedAt) ||
        left.id.localeCompare(right.id),
    );
};

export const REVIEWER_QUEUE_PAGE_SIZE = 50;

type ReviewerQueueWhere = Record<string, unknown>;

const escapeIlikeValue = (value: string) =>
  value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");

const ilikeValue = (value: string) => `%${escapeIlikeValue(value)}%`;

export const createReviewerQueueWhere = (
  filters: ReviewerQueueFilters,
  reviewerEmail: string,
  now: Date,
): ReviewerQueueWhere => {
  const conditions: ReviewerQueueWhere[] = [];
  const nowIso = now.toISOString();

  if (filters.status === "pending") {
    conditions.push({
      _or: [
        { status: { _eq: "pending" } },
        {
          _and: [
            { status: { _eq: "in_review" } },
            { claim_expires_at: { _lte: nowIso } },
          ],
        },
      ],
    });
  } else if (filters.status === "mine") {
    conditions.push({
      _and: [
        { status: { _eq: "in_review" } },
        { claim_expires_at: { _gt: nowIso } },
        { claimed_by_email: { _ilike: escapeIlikeValue(reviewerEmail) } },
      ],
    });
  } else if (filters.status === "in_review") {
    conditions.push({
      _and: [
        { status: { _eq: "in_review" } },
        { claim_expires_at: { _gt: nowIso } },
      ],
    });
  } else if (filters.status !== "all") {
    conditions.push({ status: { _eq: filters.status } });
  }

  if (filters.mode !== "all") {
    conditions.push({ app_mode: { _eq: filters.mode } });
  }
  if (filters.team) {
    const search = ilikeValue(filters.team);
    conditions.push({
      _or: [
        { team_id: { _ilike: search } },
        { team: { name: { _ilike: search } } },
      ],
    });
  }
  if (filters.assignee) {
    conditions.push({
      claimed_by_email: { _ilike: ilikeValue(filters.assignee) },
    });
  }
  const threshold = ageThresholdMs[filters.age];
  if (threshold) {
    conditions.push({
      submitted_at: { _lte: new Date(now.getTime() - threshold).toISOString() },
    });
  }

  return conditions.length ? { _and: conditions } : {};
};
