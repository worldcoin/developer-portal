"use client";

import { Icon } from "@/scenes/PortalV3/common/Icon";
import { DangerZoneSection } from "./DangerZoneSection";

/**
 * Danger zone as a collapsed row inside the wizard's Advanced settings, so
 * deleting an app takes a deliberate expand instead of a sidebar destination.
 */
export const DangerZoneDisclosure = (props: {
  appId: string;
  teamId: string;
  appName?: string;
}) => (
  <details className="group">
    <summary className="flex w-fit cursor-pointer items-center gap-2 select-none">
      <Icon
        name="chevron-down"
        className="size-3 -rotate-90 transition-transform group-open:rotate-0"
      />
      <span className="font-world text-sm font-medium text-portal-text">
        Danger zone
      </span>
    </summary>

    <div className="pt-4">
      <DangerZoneSection
        appId={props.appId}
        teamId={props.teamId}
        appName={props.appName}
      />
    </div>
  </details>
);
