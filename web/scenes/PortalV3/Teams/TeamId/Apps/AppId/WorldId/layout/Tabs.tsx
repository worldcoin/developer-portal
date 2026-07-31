"use client";

import { urls } from "@/lib/urls";
import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabClass = (active: boolean) =>
  clsx(
    "border-b-2 px-1 pb-3 font-world text-13 transition-colors",
    active
      ? "border-portal-heading text-portal-heading"
      : "border-transparent text-portal-muted hover:text-portal-ink",
  );

export const WorldIdTabs = (props: {
  teamId: string;
  appId: string;
  hasLegacyActions: boolean;
  showActions?: boolean;
}) => {
  const pathname = usePathname() ?? "";
  const ids = { team_id: props.teamId, app_id: props.appId };
  const actionsPath = urls.worldId(ids);
  const actionDetailPath = urls.worldIdActions(ids);
  const legacyActionsPath = urls.worldIdLegacyActions(ids);
  const actionsActive =
    pathname === actionsPath || pathname.startsWith(actionDetailPath);
  const legacyActionsActive =
    pathname === legacyActionsPath ||
    pathname.startsWith(`${legacyActionsPath}/`);
  const showActions = props.showActions ?? true;

  return (
    <div className="flex min-h-[40px] items-end border-b border-portal-border">
      <div className="flex items-center gap-6">
        {showActions ? (
          <Link
            href={actionsPath}
            className={tabClass(actionsActive)}
            aria-current={actionsActive ? "page" : undefined}
          >
            Actions
          </Link>
        ) : null}

        {props.hasLegacyActions ? (
          <Link
            href={legacyActionsPath}
            className={tabClass(legacyActionsActive)}
            aria-current={legacyActionsActive ? "page" : undefined}
          >
            Legacy Actions
          </Link>
        ) : null}
      </div>
    </div>
  );
};
