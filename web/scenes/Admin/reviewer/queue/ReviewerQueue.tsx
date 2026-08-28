import Link from "next/link";

import {
  applyReviewerQueueFilters,
  type ReviewerQueueFilters,
} from "../queue-filters";
import type { ReviewerQueueRow, ReviewerSubmissionStatus } from "../types";

const tabs = [
  ["pending", "Pending"],
  ["mine", "Mine"],
  ["in_review", "In Review"],
  ["changes_requested", "Changes Requested"],
  ["approved", "Approved"],
] as const;

const statusLabels: Record<ReviewerSubmissionStatus, string> = {
  pending: "Pending",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  withdrawn: "Withdrawn",
};

const statusClasses: Record<ReviewerSubmissionStatus, string> = {
  pending:
    "border-system-warning-200 bg-system-warning-100 text-system-warning-700",
  in_review: "border-blue-200 bg-blue-50 text-blue-600",
  changes_requested:
    "border-system-error-200 bg-system-error-100 text-system-error-700",
  approved:
    "border-system-success-300 bg-system-success-100 text-system-success-700",
  withdrawn: "border-grey-200 bg-grey-100 text-grey-500",
};

const tabHref = (
  filters: ReviewerQueueFilters,
  status: (typeof tabs)[number][0],
) => {
  const params = new URLSearchParams();
  params.set("status", status);
  if (filters.mode !== "all") params.set("mode", filters.mode);
  if (filters.age !== "all") params.set("age", filters.age);
  if (filters.team) params.set("team", filters.team);
  if (filters.assignee) params.set("assignee", filters.assignee);
  return `/admin/reviewer?${params.toString()}`;
};

const pageHref = (filters: ReviewerQueueFilters, page: number) => {
  const params = new URLSearchParams();
  params.set("status", filters.status);
  params.set("page", String(page));
  if (filters.mode !== "all") params.set("mode", filters.mode);
  if (filters.age !== "all") params.set("age", filters.age);
  if (filters.team) params.set("team", filters.team);
  if (filters.assignee) params.set("assignee", filters.assignee);
  return `/admin/reviewer?${params.toString()}`;
};

const formatSubmittedAt = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(date);
};

export const ReviewerQueue = ({
  currentUserEmail,
  filters,
  hasNextPage,
  submissions,
}: {
  currentUserEmail: string;
  filters: ReviewerQueueFilters;
  hasNextPage: boolean;
  submissions: ReviewerQueueRow[];
}) => {
  const visibleSubmissions = applyReviewerQueueFilters(
    submissions,
    filters,
    currentUserEmail,
  );

  return (
    <div className="grid min-h-0 gap-4 lg:grid-rows-[auto_auto_minmax(0,1fr)]">
      <nav
        aria-label="Reviewer queue views"
        className="flex gap-1 overflow-x-auto border-b border-grey-200 px-1"
      >
        {tabs.map(([status, label]) => (
          <Link
            aria-current={filters.status === status ? "page" : undefined}
            className={
              filters.status === status
                ? "border-b-2 border-grey-900 px-3 py-3 text-13 font-semibold text-grey-900"
                : "border-b-2 border-transparent px-3 py-3 text-13 font-medium text-grey-500 hover:text-grey-900"
            }
            href={tabHref(filters, status)}
            key={status}
            title={
              status === "mine"
                ? `Active claims assigned to ${currentUserEmail}`
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>

      <form
        action="/admin/reviewer"
        className="grid gap-3 rounded-12 border border-grey-200 bg-grey-50 p-3 sm:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto]"
        method="get"
      >
        <label className="grid gap-1 text-11 font-medium tracking-wide text-grey-500 uppercase">
          App mode
          <select
            className="h-10 rounded-8 border border-grey-200 bg-grey-0 px-3 text-13 font-normal tracking-normal text-grey-900 normal-case"
            defaultValue={filters.mode}
            name="mode"
          >
            <option value="all">All modes</option>
            <option value="mini-app">Mini Apps</option>
            <option value="external">External</option>
          </select>
        </label>
        <label className="grid gap-1 text-11 font-medium tracking-wide text-grey-500 uppercase">
          Team
          <input
            className="h-10 rounded-8 border border-grey-200 bg-grey-0 px-3 text-13 font-normal tracking-normal text-grey-900 normal-case"
            defaultValue={filters.team}
            name="team"
            placeholder="Name or team ID"
          />
        </label>
        <label className="grid gap-1 text-11 font-medium tracking-wide text-grey-500 uppercase">
          Submission age
          <select
            className="h-10 rounded-8 border border-grey-200 bg-grey-0 px-3 text-13 font-normal tracking-normal text-grey-900 normal-case"
            defaultValue={filters.age}
            name="age"
          >
            <option value="all">Any age</option>
            <option value="over-1d">Over 1 day</option>
            <option value="over-3d">Over 3 days</option>
            <option value="over-7d">Over 7 days</option>
            <option value="over-30d">Over 30 days</option>
          </select>
        </label>
        <label className="grid gap-1 text-11 font-medium tracking-wide text-grey-500 uppercase">
          Assignee
          <input
            className="h-10 rounded-8 border border-grey-200 bg-grey-0 px-3 text-13 font-normal tracking-normal text-grey-900 normal-case"
            defaultValue={filters.assignee}
            name="assignee"
            placeholder="Reviewer email"
          />
        </label>
        <label className="grid gap-1 text-11 font-medium tracking-wide text-grey-500 uppercase">
          Status
          <select
            className="h-10 rounded-8 border border-grey-200 bg-grey-0 px-3 text-13 font-normal tracking-normal text-grey-900 normal-case"
            defaultValue={filters.status}
            name="status"
          >
            <option value="pending">Pending</option>
            <option value="mine">Mine</option>
            <option value="in_review">In review</option>
            <option value="changes_requested">Changes requested</option>
            <option value="approved">Approved</option>
            <option value="all">All visible statuses</option>
          </select>
        </label>
        <button
          className="self-end rounded-8 bg-grey-900 px-4 py-2.5 text-13 font-semibold text-grey-0 hover:bg-grey-700"
          type="submit"
        >
          Apply
        </button>
      </form>

      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
        <div className="min-h-0 overflow-auto rounded-12 border border-grey-200">
          <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-13">
            <caption className="sr-only">
              Listing review submissions, oldest first
            </caption>
            <thead className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              <tr>
                {["App", "Mode", "Team", "Submitted", "Assignee", "Status"].map(
                  (label) => (
                    <th
                      className="sticky top-0 z-10 border-b border-grey-200 bg-grey-0 p-3"
                      key={label}
                      scope="col"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100 bg-grey-0 text-grey-700">
              {visibleSubmissions.map((submission) => {
                const claimExpiry = submission.claimExpiresAt
                  ? Date.parse(submission.claimExpiresAt)
                  : Number.NaN;
                const isAvailableAfterLeaseExpiry =
                  submission.status === "in_review" &&
                  Number.isFinite(claimExpiry) &&
                  claimExpiry <= Date.now();
                const displayedStatus = isAvailableAfterLeaseExpiry
                  ? "pending"
                  : submission.status;

                return (
                  <tr className="hover:bg-grey-50" key={submission.id}>
                    <th className="p-3 font-normal" scope="row">
                      <Link
                        className="block font-semibold text-grey-900 hover:text-blue-500"
                        href={`/admin/reviewer/${submission.id}`}
                      >
                        {submission.appName}
                      </Link>
                      <span className="mt-1 block font-mono text-11 text-grey-400">
                        Attempt {submission.attempt} · {submission.appId}
                      </span>
                    </th>
                    <td className="p-3">
                      {submission.appMode === "mini-app"
                        ? "Mini App"
                        : "External"}
                    </td>
                    <td className="p-3">
                      <span className="block font-medium text-grey-900">
                        {submission.teamName}
                      </span>
                      <span className="font-mono text-11 text-grey-400">
                        {submission.teamId}
                      </span>
                    </td>
                    <td className="p-3">
                      <time dateTime={submission.submittedAt}>
                        {formatSubmittedAt(submission.submittedAt)}
                      </time>
                    </td>
                    <td className="max-w-52 truncate p-3">
                      {isAvailableAfterLeaseExpiry
                        ? "Unassigned"
                        : submission.claimedByEmail ?? "Unassigned"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-11 font-semibold ${statusClasses[displayedStatus]}`}
                      >
                        {isAvailableAfterLeaseExpiry
                          ? "Available — lease expired"
                          : statusLabels[displayedStatus]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {visibleSubmissions.length === 0 ? (
                <tr>
                  <td
                    className="p-10 text-center text-14 text-grey-500"
                    colSpan={6}
                  >
                    No submissions match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <nav
          aria-label="Reviewer queue pagination"
          className="flex items-center justify-end gap-2"
        >
          {filters.page > 1 ? (
            <Link
              aria-label="Previous page"
              className="rounded-8 border border-grey-200 px-3 py-2 text-12 font-semibold text-grey-700 hover:bg-grey-50"
              href={pageHref(filters, filters.page - 1)}
            >
              Previous
            </Link>
          ) : null}
          <span className="px-2 text-12 text-grey-500">
            Page {filters.page}
          </span>
          {hasNextPage ? (
            <Link
              aria-label="Next page"
              className="rounded-8 border border-grey-200 px-3 py-2 text-12 font-semibold text-grey-700 hover:bg-grey-50"
              href={pageHref(filters, filters.page + 1)}
            >
              Next
            </Link>
          ) : null}
        </nav>
      </div>
    </div>
  );
};
