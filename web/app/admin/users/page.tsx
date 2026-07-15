import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminUsersPage } from "@/scenes/Admin/users/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Users" }),
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser();

  return <AdminUsersPage searchParams={searchParams} />;
}
