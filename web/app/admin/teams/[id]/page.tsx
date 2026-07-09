import { requireAdminUser } from "@/lib/admin-auth";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AdminTeamPage } from "@/scenes/Admin/teams/id/page";
import { Metadata } from "next";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Team" }),
};

export default async function Page({ params }: PageProps) {
  await requireAdminUser();

  const { id } = await params;

  return <AdminTeamPage teamId={id} />;
}
