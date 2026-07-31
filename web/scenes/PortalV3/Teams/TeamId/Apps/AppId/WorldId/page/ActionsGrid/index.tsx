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
  initialDialogOpen?: boolean;
  onCreateActionRequested?: () => void;
  onCreateActionConsumed: () => void;
  onActionsChanged: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(
    Boolean(props.initialDialogOpen) && props.canCreate,
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (props.initialDialogOpen && props.canCreate) {
      setDialogOpen(true);
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

  const handleDialogClose = (success?: boolean) => {
    setDialogOpen(false);
    props.onCreateActionConsumed();
    if (success) {
      props.onActionsChanged();
    }
  };

  const handleCreateAction = () => {
    if (props.onCreateActionRequested) {
      props.onCreateActionRequested();
      return;
    }

    setDialogOpen(true);
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
          />
        ))}
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

      {props.canCreate && dialogOpen ? (
        <CreateActionDialogV4 open={dialogOpen} onClose={handleDialogClose} />
      ) : null}
    </>
  );
};
