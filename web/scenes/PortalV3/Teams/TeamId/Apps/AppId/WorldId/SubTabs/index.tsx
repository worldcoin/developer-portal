"use client";

import { urls } from "@/lib/urls";
import { SectionSubTabs } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/common/SectionSubTabs";
import { useParams, usePathname } from "next/navigation";

// World ID section tabs. Reaching /world-id-4-0 or /world-id-actions implies an
// RP registration (the route layouts redirect otherwise), so both tabs are
// always valid here — no per-tab flag gating needed. Legacy /actions is left
// out for now.
export const WorldIdSubTabs = () => {
  const params = useParams<{ teamId: string; appId: string }>();
  const pathname = usePathname() ?? "";

  const ids = {
    team_id: params?.teamId ?? "",
    app_id: params?.appId ?? "",
  };
  const worldId40Path = urls.worldId40(ids);
  const actionsPath = urls.worldIdActions(ids);

  return (
    <SectionSubTabs
      items={[
        {
          label: "World ID 4.0",
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
      ]}
    />
  );
};
