"use client";

import { urls } from "@/lib/urls";
import { WORLD_ID_TABS, type WorldIdTab } from "@/lib/world-id-tabs";
import clsx from "clsx";
import Link from "next/link";
import { ActionsSearch } from "./ActionsSearch";

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
  activeTab: WorldIdTab;
  showActions?: boolean;
  showSearch?: boolean;
  search: string;
  onSearchChange?: (value: string) => void;
}) => {
  const ids = { team_id: props.teamId, app_id: props.appId };
  const showActions = props.showActions ?? true;
  const showSearch =
    (props.showSearch ?? true) &&
    props.activeTab !== WORLD_ID_TABS.Configuration;

  const tabs = [
    ...(showActions
      ? [
          {
            label: "Actions",
            tab: WORLD_ID_TABS.Actions,
          },
        ]
      : []),
    {
      label: "World ID",
      tab: WORLD_ID_TABS.Configuration,
    },
    ...(props.hasLegacyActions
      ? [
          {
            label: "Legacy Actions",
            tab: WORLD_ID_TABS.LegacyActions,
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-[40px] flex-col gap-3 border-b border-portal-border sm:min-h-[52px] sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-6">
        {tabs.map(({ label, tab }) => {
          const active = props.activeTab === tab;

          return (
            <Link
              key={tab}
              href={urls.worldIdTab({ ...ids, tab })}
              className={tabClass(active)}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {showSearch ? (
        <div className="w-full pb-3 sm:w-64">
          <ActionsSearch
            value={props.search}
            onChange={(event) => props.onSearchChange?.(event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
};
