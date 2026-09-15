import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminSandboxRequestsIosPage } from "@/scenes/Admin/sandbox-requests-ios/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Sandbox / iOS" }),
};

export default async function Page() {
  await requireAdminUser();

  return <AdminSandboxRequestsIosPage />;
}
