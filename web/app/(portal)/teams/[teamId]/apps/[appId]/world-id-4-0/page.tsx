import { WorldId40Page } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page";

type Props = {
  params: {
    teamId: string;
    appId: string;
  };
};

export default function Page({ params }: Props) {
  return <WorldId40Page params={params} />;
}
