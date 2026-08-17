import { generateMetaTitle } from "@/lib/generate-title";
import { urls } from "@/lib/urls";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Permissions" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  const params = await props.params;

  return redirect(
    urls.miniAppDevelop({
      team_id: params.teamId,
      app_id: params.appId,
    }),
  );
}
