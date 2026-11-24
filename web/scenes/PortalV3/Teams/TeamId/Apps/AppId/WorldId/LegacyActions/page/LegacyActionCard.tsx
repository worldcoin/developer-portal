"use client";

import {
  actionCardDescriptionClassName,
  actionCardFrameClassName,
  actionCardTitleClassName,
} from "../../page/ActionCard";
import type { GetActionsQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/actions.generated";
import Link from "next/link";

type LegacyAction = GetActionsQuery["actions"][number];

export const LegacyActionCard = (props: {
  action: LegacyAction;
  href: string;
}) => {
  const uses = props.action.nullifiers.aggregate?.sum?.uses ?? 0;

  return (
    <Link
      href={props.href}
      className={`${actionCardFrameClassName} transition-shadow hover:shadow-portal-card`}
    >
      <div className="flex flex-col gap-1">
        <span className={actionCardTitleClassName}>
          {props.action.name || props.action.action}
        </span>
        <span className={actionCardDescriptionClassName}>
          {props.action.action}
        </span>
        {props.action.description ? (
          <span className="mt-1 line-clamp-2 font-world text-12 text-portal-subtle">
            {props.action.description}
          </span>
        ) : null}
      </div>

      <span className="mt-auto font-world text-12 text-portal-subtle">
        {uses} {uses === 1 ? "use" : "uses"}
      </span>
    </Link>
  );
};
