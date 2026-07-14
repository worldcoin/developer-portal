import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { WorldId40Page } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldId40/page";
import { WorldId40Page as WorldId40PageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId40/page";

type Props = { params: Promise<{ teamId: string; appId: string }> };

export default async function Page(props: Props) {
  const params = await props.params;
  return pickPortalVersion(
    () => <WorldId40PageV3 params={params} />,
    () => <WorldId40Page params={params} />,
  );
}
