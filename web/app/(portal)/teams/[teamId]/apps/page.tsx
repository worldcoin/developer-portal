import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function Page(props: Props) {
  const params = await props.params;

  // Keep this legacy apps URL working for bookmarks and old links without
  // maintaining duplicate UI.
  return redirect(urls.teams({ team_id: params.teamId }));
}
