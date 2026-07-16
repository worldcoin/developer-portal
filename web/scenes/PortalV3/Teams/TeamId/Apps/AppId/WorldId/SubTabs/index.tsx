"use client";

import { urls } from "@/lib/urls";
import { SectionSubTabs } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/common/SectionSubTabs";
import { useParams, usePathname } from "next/navigation";

export const WorldIdSubTabs = (props: { hasLegacyActions: boolean }) => {
  const params = useParams<{ teamId: string; appId: string }>();
  const pathname = usePathname() ?? "";

  const ids = {
    team_id: params?.teamId ?? "",
    app_id: params?.appId ?? "",
  };
  const worldId40Path = urls.worldId40(ids);
  const actionsPath = urls.worldIdActions(ids);
  const legacyActionsPath = urls.actions(ids);

  return (
    <SectionSubTabs
      items={[
        {
          label: "World ID",
          href: worldId40Path,
          segment: "world-id-4-0",
          active: pathname.startsWith(worldId40Path),
        },
        {
          label: "Actions",
          href: actionsPath,
          segment: "world-id-actions",
          active: pathname.startsWith(actionsPath),
        },
        ...(props.hasLegacyActions
          ? [
              {
                label: "Legacy Actions",
                href: legacyActionsPath,
                segment: "actions",
                active: pathname.startsWith(legacyActionsPath),
              },
            ]
          : []),
      ]}
    />
  );
};
