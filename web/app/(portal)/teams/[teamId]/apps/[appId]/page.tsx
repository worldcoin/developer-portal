import { generateMetaTitle } from "@/lib/generate-title";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const ids = { team_id: params.teamId, app_id: params.appId };

  if (searchParams.enableWorldId4 === "true") {
    return redirect(
      urls.worldIdTab({
        ...ids,
        tab: WORLD_ID_TABS.Configuration,
        query: { enableWorldId4: "true" },
      }),
    );
  }
  return redirect(urls.worldId(ids));
}
