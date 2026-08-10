import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "API keys" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function Page(props: Props) {
  const params = await props.params;

  redirect(urls.teamSettings({ team_id: params.teamId }));
}
