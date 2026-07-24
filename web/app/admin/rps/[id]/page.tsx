import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminRpPage } from "@/scenes/Admin/rps/id/page";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "RP" }),
};

export default async function Page({ params }: PageProps) {
  await requireAdminUser();
  const { id } = await params;

  return <AdminRpPage rpId={id} />;
}
