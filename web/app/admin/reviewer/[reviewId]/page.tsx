import {
  isAdminReviewerPortalEnabled,
  requireAdminUser,
} from "@/lib/admin-auth";
import { isUuid } from "@/api/admin/reviewer/request-schema";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminReviewerSubmissionPage } from "@/scenes/Admin/reviewer/id/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Review submission" }),
};

type PageProps = { params: Promise<{ reviewId: string }> };

export default async function Page({ params }: PageProps) {
  const user = await requireAdminUser();
  if (!isAdminReviewerPortalEnabled()) notFound();
  const { reviewId } = await params;
  if (!isUuid(reviewId)) notFound();

  return <AdminReviewerSubmissionPage reviewId={reviewId} user={user} />;
}
