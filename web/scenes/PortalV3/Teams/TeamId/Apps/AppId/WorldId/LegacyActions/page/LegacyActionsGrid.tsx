"use client";

import type { GetActionsQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/actions.generated";
import { useEffect, useState } from "react";
import { LegacyActionCard } from "./LegacyActionCard";

const ACTIONS_PER_PAGE = 12;

type LegacyAction = GetActionsQuery["actions"][number];

export const LegacyActionsGrid = (props: {
  actions: LegacyAction[];
  search: string;
  getActionHref: (action: LegacyAction) => string;
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [props.search]);

  const query = props.search.trim().toLowerCase();
  const filteredActions = props.actions.filter((action) =>
    `${action.name} ${action.action} ${action.description}`
      .toLowerCase()
      .includes(query),
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredActions.length / ACTIONS_PER_PAGE),
  );
  const page = Math.min(currentPage, totalPages);
  const pageActions = filteredActions.slice(
    (page - 1) * ACTIONS_PER_PAGE,
    page * ACTIONS_PER_PAGE,
  );

  if (pageActions.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-portal-border px-5 py-12 text-center font-world text-13 text-portal-muted">
        No legacy actions match your search.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageActions.map((action) => (
          <LegacyActionCard
            key={action.id}
            action={action}
            href={props.getActionHref(action)}
          />
        ))}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Legacy action pages"
          className="flex items-center justify-center gap-4 pt-2"
        >
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setCurrentPage(page - 1)}
            className="rounded-full border border-portal-border px-4 py-2 font-world text-13 text-portal-text disabled:cursor-not-allowed disabled:text-portal-subtle"
          >
            Previous
          </button>
          <span className="font-world text-13 text-portal-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setCurrentPage(page + 1)}
            className="rounded-full border border-portal-border px-4 py-2 font-world text-13 text-portal-text disabled:cursor-not-allowed disabled:text-portal-subtle"
          >
            Next
          </button>
        </nav>
      ) : null}
    </>
  );
};
