import { WorldId40Page } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page";

type Props = {
  params: Promise<{
    teamId: string;
    appId: string;
  }>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  return <WorldId40Page params={params} />;
}
