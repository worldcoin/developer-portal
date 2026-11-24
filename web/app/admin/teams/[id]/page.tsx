import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminTeamPage } from "@/scenes/Admin/teams/id/page";
import { AdminSearchParamsController } from "@/components/AdminDashboard/common/SearchParamsController";
import { Metadata } from "next";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    appsPage?: string | string[];
    appsQuery?: string | string[];
    membersPage?: string | string[];
    membersQuery?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Team" }),
};

export default async function Page({ params, searchParams }: PageProps) {
  await requireAdminUser();

  const { id } = await params;

  return (
    <AdminSearchParamsController>
      <AdminTeamPage searchParams={searchParams} teamId={id} />
    </AdminSearchParamsController>
  );
}
