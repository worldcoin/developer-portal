"use client";

import { SearchIcon } from "@/components/Icons/SearchIcon";
import { Input } from "@/components/Input";
import clsx from "clsx";
import Link from "next/link";

export type WorldIdTab = "actions" | "world-id-4-0";

const tabClass = (active: boolean) =>
  clsx(
    "border-b-2 px-1 pb-3 font-world text-13 transition-colors",
    active
      ? "border-portal-heading text-portal-heading"
      : "border-transparent text-portal-muted hover:text-portal-ink",
  );

export const WorldIdTabs = (props: {
  tab: WorldIdTab;
  onTabChange: (tab: WorldIdTab) => void;
  legacyActionsHref?: string;
  search: string;
  onSearchChange: (value: string) => void;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-2 border-b border-portal-border sm:min-h-[49px]">
    <div className="flex items-center gap-6">
      <button
        type="button"
        className={tabClass(props.tab === "actions")}
        aria-current={props.tab === "actions" ? "true" : undefined}
        onClick={() => props.onTabChange("actions")}
      >
        Actions
      </button>
      <button
        type="button"
        className={tabClass(props.tab === "world-id-4-0")}
        aria-current={props.tab === "world-id-4-0" ? "true" : undefined}
        onClick={() => props.onTabChange("world-id-4-0")}
      >
        World ID
      </button>
      {props.legacyActionsHref ? (
        <Link href={props.legacyActionsHref} className={tabClass(false)}>
          World ID 3.0 Legacy
        </Link>
      ) : null}
    </div>

    {props.tab === "actions" ? (
      <div className="w-full pb-2 sm:w-64">
        <Input
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          label=""
          aria-label="Search actions"
          placeholder="Search actions"
          className="h-10 w-full py-0 text-sm"
          addOnLeft={<SearchIcon className="mx-2 text-grey-400" />}
        />
      </div>
    ) : null}
  </div>
);
