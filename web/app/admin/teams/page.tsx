import { parseTeamColumnVisibility } from "@/components/AdminDashboard/Teams/column-visibility";
import {
  parseTeamsLimit,
  parseTeamsPage,
} from "@/components/AdminDashboard/Teams/pagination";
import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminTeamsPage } from "@/scenes/Admin/teams/page";
import { Metadata } from "next";

type PageProps = {
  searchParams: Promise<{
    columns?: string | string[];
    limit?: string | string[];
    page?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Teams" }),
};

export default async function Page({ searchParams }: PageProps) {
  await requireAdminUser();

  const params = await searchParams;
  const columnVisibility = parseTeamColumnVisibility(params.columns);
  const limit = parseTeamsLimit(params.limit);
  const page = parseTeamsPage(params.page);

  return (
    <AdminTeamsPage
      columnVisibility={columnVisibility}
      limit={limit}
      page={page}
    />
  );
}
