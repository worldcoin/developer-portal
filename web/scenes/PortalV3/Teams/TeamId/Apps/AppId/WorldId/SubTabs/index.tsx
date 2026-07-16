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
  const worldIdPath = `${worldId40Path}?tab=world-id-4-0`;
  const actionDetailPath = urls.worldIdActions(ids);
  const legacyActionsPath = urls.actions(ids);

  return (
    <SectionSubTabs
      items={[
        {
          label: "Actions",
          href: worldId40Path,
          segment: "world-id-actions",
          active: pathname.startsWith(actionDetailPath),
        },
        {
          label: "World ID",
          href: worldIdPath,
          segment: "world-id-4-0",
          active: pathname.startsWith(worldId40Path),
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
