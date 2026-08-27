import type { AdminUser } from "@/lib/admin-auth";
import { canReviewApps } from "@/lib/admin-auth";
import { UIModule } from "@/components/AdminDashboard/UIModule";

import { parseReviewerQueueFilters } from "./queue-filters";
import { ReviewerQueue } from "./queue/ReviewerQueue";
import { fetchReviewerQueue } from "./server/fetch-reviewer-data";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const AdminReviewerQueuePage = async ({
  searchParams,
  user,
}: {
  searchParams: SearchParams;
  user: AdminUser;
}) => {
  const params = await searchParams;
  const filters = parseReviewerQueueFilters(params);
  const { hasNextPage, submissions } = await fetchReviewerQueue({
    filters,
    reviewerEmail: user.email,
  });
  const canReview = canReviewApps(user);

  return (
    <div className="grid min-h-0 gap-4 max-lg:h-auto lg:h-full lg:grid-rows-[auto_minmax(0,1fr)]">
      <UIModule className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Staging reviewer portal
            </p>
            <h1 className="mt-2 text-24 font-semibold tracking-[-0.02em] text-grey-900">
              Listing reviews
            </h1>
            <p className="mt-2 max-w-2xl text-14 text-grey-500">
              Review developer-consented Mini App and external integration
              submissions. The oldest eligible submission appears first.
            </p>
          </div>
          <div className="rounded-12 border border-grey-200 bg-grey-50 px-3 py-2">
            <p className="text-11 font-medium tracking-wide text-grey-400 uppercase">
              Rows on page
            </p>
            <p className="mt-1 text-20 font-semibold text-grey-900">
              {submissions.length}
            </p>
          </div>
        </div>
        {!canReview ? (
          <div className="mt-4 rounded-8 border border-system-warning-200 bg-system-warning-100 p-3 text-12 text-system-warning-700">
            You have read-only admin access. You can inspect every submission,
            but claiming, checklist edits, retries, and decisions require the
            reviewer access group.
          </div>
        ) : null}
      </UIModule>

      <UIModule className="min-h-0 overflow-hidden p-4">
        <ReviewerQueue
          currentUserEmail={user.email}
          filters={filters}
          hasNextPage={hasNextPage}
          submissions={submissions}
        />
      </UIModule>
    </div>
  );
};
