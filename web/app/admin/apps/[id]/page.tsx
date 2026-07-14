import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminAppPage } from "@/scenes/Admin/apps/id/page";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "App" }),
};

export default async function Page({ params }: PageProps) {
  await requireAdminUser();
  const { id } = await params;

  return <AdminAppPage appId={id} />;
}
