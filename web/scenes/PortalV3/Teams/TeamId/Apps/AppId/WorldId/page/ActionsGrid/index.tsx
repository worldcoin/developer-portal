"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ActionCard, ActionCardItem } from "../ActionCard";
import { CreateActionTile } from "./CreateActionTile";

const ACTIONS_PER_PAGE = 12;

const CreateActionDialogV4 = dynamic(() =>
  import(
    "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page/CreateActionDialogV4"
  ).then((module) => module.CreateActionDialogV4),
);

export const ActionsGrid = (props: {
  actions: ActionCardItem[];
  teamId: string;
  appId: string;
  search: string;
  canCreate: boolean;
  /** Why creation is unavailable, shown when the grid has nothing to render. */
  emptyReason: string;
  initialDialogOpen?: boolean;
  onCreateActionConsumed: () => void;
  onActionsChanged: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(
    Boolean(props.initialDialogOpen) && props.canCreate,
  );
  const [hasOpenedDialog, setHasOpenedDialog] = useState(dialogOpen);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (props.initialDialogOpen && props.canCreate) {
      setDialogOpen(true);
      setHasOpenedDialog(true);
    }
  }, [props.initialDialogOpen, props.canCreate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [props.search]);

  const query = props.search.toLowerCase();
  const filtered = props.actions.filter((action) =>
    `${action.action} ${action.description}`.toLowerCase().includes(query),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ACTIONS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageActions = filtered.slice(
    (page - 1) * ACTIONS_PER_PAGE,
    page * ACTIONS_PER_PAGE,
  );
  const [previews, setPreviews] = useState<
    Record<
      string,
      { count: string; series: Array<{ count: string; date: string }> }
    >
  >({});

  useEffect(() => {
    if (!pageActions.length) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      environment: "production",
      period: "last_7_days",
      action_ids: pageActions.map((action) => action.id).join(","),
    });
    void fetch(`/api/portal/apps/${props.appId}/world-id-analytics?${params}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("analytics request failed");
        return response.json();
      })
      .then(
        (body: {
          actions?: Array<{
            id: string;
            count: string;
            series: Array<{ count: string; date: string }>;
          }>;
        }) => {
          setPreviews(
            Object.fromEntries(
              (body.actions ?? []).map((item) => [
                item.id,
                { count: item.count, series: item.series },
              ]),
            ),
          );
        },
      )
      .catch(() => {});
    return () => controller.abort();
  }, [props.appId, page, props.search]);

  // The create tile is its own empty state, so only explain a grid that would
  // otherwise render nothing at all.
  const emptyMessage =
    filtered.length > 0
      ? null
      : props.search
        ? "No actions match your search."
        : props.canCreate
          ? null
          : props.emptyReason;

  const handleDialogClose = (success?: boolean) => {
    setDialogOpen(false);
    props.onCreateActionConsumed();
    if (success) {
      props.onActionsChanged();
    }
  };

  const handleCreateAction = () => {
    setDialogOpen(true);
    setHasOpenedDialog(true);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {props.canCreate ? (
          <CreateActionTile onClick={handleCreateAction} />
        ) : null}

        {pageActions.map((action) => (
          <ActionCard
            key={action.id}
            teamId={props.teamId}
            appId={props.appId}
            action={action}
            previewCount={previews[action.id]?.count}
            previewSeries={previews[action.id]?.series}
          />
        ))}

        {emptyMessage ? (
          <div className="col-span-full rounded-[10px] border border-dashed border-portal-border px-5 py-12 text-center font-world text-13 text-portal-muted">
            {emptyMessage}
          </div>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Action pages"
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

      {props.canCreate && hasOpenedDialog ? (
        <CreateActionDialogV4 open={dialogOpen} onClose={handleDialogClose} />
      ) : null}
    </>
  );
};
