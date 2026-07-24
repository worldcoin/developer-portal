"use client";

import { urls } from "@/lib/urls";
import Link from "next/link";

export type ActionCardItem = {
  id: string;
  action: string;
  description: string;
};

/** Card chrome, shared with the loading skeleton. */
export const actionCardFrameClassName =
  "flex min-h-[144px] flex-col gap-1 rounded-[10px] border border-portal-border bg-white p-5";
export const actionCardTitleClassName = "font-ibm text-13 text-portal-heading";
export const actionCardDescriptionClassName =
  "font-world text-13 text-portal-muted";

export const ActionCard = (props: {
  teamId: string;
  appId: string;
  action: ActionCardItem;
}) => {
  const { action } = props;

  return (
    <Link
      href={urls.worldIdAction({
        team_id: props.teamId,
        app_id: props.appId,
        action_id: action.id,
      })}
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
    </Link>
  );
};
