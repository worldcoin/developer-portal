import {
  isAdminReviewerPortalEnabled,
  requireAdminUser,
} from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminReviewerQueuePage } from "@/scenes/Admin/reviewer/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Reviewer" }),
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: PageProps) {
  const user = await requireAdminUser();
  if (!isAdminReviewerPortalEnabled()) notFound();

  return <AdminReviewerQueuePage searchParams={searchParams} user={user} />;
}
