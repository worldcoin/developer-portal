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
  const worldIdPath = urls.worldId(ids);
  const worldIdSettingsPath = `${worldIdPath}?tab=world-id-4-0`;
  const actionDetailPath = urls.worldIdActions(ids);
  const legacyActionsPath = urls.worldIdLegacyActions(ids);
  const deprecatedLegacyActionsPath = urls.actions(ids);
  const legacyActionsActive =
    pathname === legacyActionsPath ||
    pathname.startsWith(`${legacyActionsPath}/`) ||
    pathname === deprecatedLegacyActionsPath ||
    pathname.startsWith(`${deprecatedLegacyActionsPath}/`);

  return (
    <SectionSubTabs
      items={[
        {
          label: "Actions",
          href: worldIdPath,
          segment: "world-id-actions",
          active: pathname.startsWith(actionDetailPath),
        },
        {
          label: "World ID",
          href: worldIdSettingsPath,
          segment: "world-id-4-0",
          active:
            pathname.startsWith(worldIdPath) &&
            !pathname.startsWith(actionDetailPath) &&
            !legacyActionsActive,
        },
        ...(props.hasLegacyActions
          ? [
              {
                label: "Legacy Actions",
                href: legacyActionsPath,
                segment: "actions",
                active: legacyActionsActive,
              },
            ]
          : []),
      ]}
    />
  );
};
