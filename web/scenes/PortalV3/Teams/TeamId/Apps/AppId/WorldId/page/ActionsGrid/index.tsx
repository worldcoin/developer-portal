"use client";

import { CreateActionDialogV4 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/page/CreateActionDialogV4";
import { useState } from "react";
import { ActionCard, ActionCardItem } from "../ActionCard";

export const ActionsGrid = (props: {
  actions: ActionCardItem[];
  teamId: string;
  appId: string;
  search: string;
  initialDialogOpen?: boolean;
  onCreateActionRequested?: () => void;
  onCreateActionConsumed: () => void;
  onActionsChanged: () => void;
}) => {
  const [dialogOpen, setDialogOpen] = useState(
    props.initialDialogOpen ?? false,
  );

  const query = props.search.toLowerCase();
  const filtered = props.actions.filter((action) =>
    `${action.action} ${action.description}`.toLowerCase().includes(query),
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
        {filtered.map((action) => (
          <ActionCard
            key={action.id}
            teamId={props.teamId}
            appId={props.appId}
            action={action}
          />
        ))}

        <button
          type="button"
          onClick={handleCreateAction}
          className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-portal-border text-portal-muted transition-colors hover:border-portal-ink hover:text-portal-ink"
          aria-label="Create action"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          <span className="font-world text-13">Create action</span>
        </button>
      </div>

      {dialogOpen ? (
        <CreateActionDialogV4 open={dialogOpen} onClose={handleDialogClose} />
      ) : null}
    </>
  );
};
