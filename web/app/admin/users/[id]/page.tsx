import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminUserPage } from "@/scenes/Admin/users/id/page";
import { Metadata } from "next";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "User" }),
};

export default async function Page({ params }: PageProps) {
  await requireAdminUser();

  const { id } = await params;

  return <AdminUserPage userId={id} />;
}
