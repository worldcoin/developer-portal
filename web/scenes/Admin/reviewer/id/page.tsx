import type { AdminUser } from "@/lib/admin-auth";
import { canReviewApps } from "@/lib/admin-auth";
import { notFound } from "next/navigation";

import { ReviewerWorkspace } from "../detail/ReviewerWorkspace";
import { fetchReviewerSubmission } from "../server/fetch-reviewer-data";

export const AdminReviewerSubmissionPage = async ({
  reviewId,
  user,
}: {
  reviewId: string;
  user: AdminUser;
}) => {
  const submission = await fetchReviewerSubmission(reviewId);
  if (!submission) notFound();

  return (
    <ReviewerWorkspace
      canReview={canReviewApps(user)}
      currentUserEmail={user.email}
      submission={submission}
    />
  );
};
