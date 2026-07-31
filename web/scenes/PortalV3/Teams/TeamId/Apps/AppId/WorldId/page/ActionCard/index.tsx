"use client";

import { urls } from "@/lib/urls";
import type { AnalyticsPoint } from "@/lib/world-id-analytics";
import { Sparkline } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/common/Sparkline";
import Link from "next/link";

export type ActionCardItem = {
  id: string;
  action: string;
  description: string;
};

/** Card chrome, shared with the loading skeleton. */
export const actionCardFrameClassName =
  "flex min-h-[220px] flex-col justify-between gap-4 rounded-[10px] border border-portal-border bg-white p-5";
export const actionCardTitleClassName =
  "font-ibm text-13 leading-[1.2] text-portal-heading";
export const actionCardDescriptionClassName =
  "font-world text-13 text-portal-muted";

export const ActionCard = (props: {
  teamId: string;
  appId: string;
  action: ActionCardItem;
  previewCount?: string;
  previewSeries?: AnalyticsPoint[];
}) => {
  const { action } = props;

  return (
    <Link
      href={urls.worldIdAction({
        team_id: props.teamId,
        app_id: props.appId,
        action_id: action.id,
      })}
      // Keep the accessible name to the action identifier; the preview
      // stats inside the link would otherwise concatenate into it.
      aria-label={action.action}
      className={`${actionCardFrameClassName} transition-shadow hover:shadow-portal-card`}
    >
      <div className="flex flex-col gap-1">
        <span className={actionCardTitleClassName}>{action.action}</span>
        {action.description ? (
          <span className={actionCardDescriptionClassName}>
            {action.description}
          </span>
        ) : null}
      </div>
      <Sparkline
        points={
          props.previewSeries?.map((point) => ({ count: point.count })) ?? []
        }
        ariaLabel={`Unique Verifications for ${action.action}`}
        className="h-12 w-full text-portal-heading"
      />
      <div className="flex items-baseline gap-1.5">
        <span className="font-twk text-20 leading-none font-medium text-portal-heading">
          {BigInt(props.previewCount ?? "0").toLocaleString()}
        </span>
        <span className="font-world text-13 text-portal-muted">
          Unique Verifications
        </span>
      </div>
    </Link>
  );
};
