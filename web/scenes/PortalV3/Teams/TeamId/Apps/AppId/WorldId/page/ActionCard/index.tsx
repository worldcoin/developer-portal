"use client";

import { relativeTimeShort } from "@/lib/relative-time-short";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { Sparkline } from "../../common/Sparkline";

export type ActionCardItem = {
  id: string;
  action: string;
  description: string;
  total: number;
  latestAt: string | null;
  points: number[];
};

export const ActionCard = (props: {
  teamId: string;
  appId: string;
  action: ActionCardItem;
}) => {
  const { action } = props;
  const footer =
    action.total > 0 && action.latestAt
      ? `${action.total.toLocaleString()} uses · last ${relativeTimeShort(
          action.latestAt,
        )}`
      : `${action.total.toLocaleString()} uses`;

  return (
    <Link
      href={urls.worldIdActionDetail({
        team_id: props.teamId,
        app_id: props.appId,
        action_id: action.id,
      })}
      className="flex min-h-[220px] flex-col justify-between gap-4 rounded-[10px] border border-portal-border bg-white p-5 transition-shadow hover:shadow-portal-card"
    >
      <div className="flex flex-col gap-1">
        <span className="font-ibm text-13 text-portal-heading">
          {action.action}
        </span>
        {action.description ? (
          <span className="font-world text-13 text-portal-muted">
            {action.description}
          </span>
        ) : null}
      </div>
      <Sparkline
        points={action.points}
        className="h-12 w-full text-portal-heading"
        ariaLabel={`Verifications for ${action.action}`}
      />
      <span className="font-world text-12 text-portal-muted">{footer}</span>
    </Link>
  );
};
