import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminTeamsPage } from "@/scenes/Admin/teams/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Teams" }),
};

export default async function Page() {
  await requireAdminUser();

  return <AdminTeamsPage />;
}
