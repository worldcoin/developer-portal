import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminUserPage } from "@/scenes/Admin/users/id/page";
import { AdminSearchParamsController } from "@/components/AdminDashboard/common/SearchParamsController";
import { Metadata } from "next";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    appsPage?: string | string[];
    appsQuery?: string | string[];
    teamsPage?: string | string[];
    teamsQuery?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "User" }),
};

export default async function Page({ params, searchParams }: PageProps) {
  await requireAdminUser();

  const { id } = await params;

  return (
    <AdminSearchParamsController>
      <AdminUserPage searchParams={searchParams} userId={id} />
    </AdminSearchParamsController>
  );
}
