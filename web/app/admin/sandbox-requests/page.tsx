import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminSandboxRequestsPage } from "@/scenes/Admin/sandbox-requests/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Sandbox requests" }),
};

export default async function Page() {
  await requireAdminUser();

  return <AdminSandboxRequestsPage />;
}
