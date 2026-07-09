import { parseTeamsLimit } from "@/components/AdminDashboard/Teams/pagination";
import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminTeamsPage } from "@/scenes/Admin/teams/page";
import { Metadata } from "next";

type PageProps = {
  searchParams: Promise<{
    limit?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Teams" }),
};

export default async function Page({ searchParams }: PageProps) {
  await requireAdminUser();

  const params = await searchParams;
  const limit = parseTeamsLimit(params.limit);

  return <AdminTeamsPage limit={limit} />;
}
