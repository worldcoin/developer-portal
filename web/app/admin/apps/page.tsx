import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminAppsPage } from "@/scenes/Admin/apps/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

export default async function Page() {
  await requireAdminUser();

  return <AdminAppsPage />;
}
