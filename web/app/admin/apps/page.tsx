import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminAppsPage } from "@/scenes/Admin/apps/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

type PageProps = {
  searchParams: Promise<{
    columns?: string | string[];
    limit?: string | string[];
    page?: string | string[];
    query?: string | string[];
    sort?: string | string[];
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  await requireAdminUser();

  return <AdminAppsPage searchParams={searchParams} />;
}
