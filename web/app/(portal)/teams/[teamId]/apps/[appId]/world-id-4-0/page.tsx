import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "World ID" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

// `/world-id` is the canonical route; this legacy route only redirects so
// old bookmarks keep working.
export default async function Page(props: Props) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  return redirect(
    urls.worldIdTab({
      team_id: params.teamId,
      app_id: params.appId,
      tab: WORLD_ID_TABS.Configuration,
      query: searchParams,
    }),
  );
}
