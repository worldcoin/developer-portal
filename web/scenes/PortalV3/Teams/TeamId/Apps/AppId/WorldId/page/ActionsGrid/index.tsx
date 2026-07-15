"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ActionCard, ActionCardItem } from "../ActionCard";

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

  useEffect(() => {
    if (props.initialDialogOpen && props.canCreate) {
      setDialogOpen(true);
    }
  }, [props.initialDialogOpen, props.canCreate]);

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
        {props.canCreate ? (
          <button
            type="button"
            onClick={handleCreateAction}
            className="flex min-h-[144px] flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-portal-border text-portal-muted transition-colors hover:border-portal-ink hover:text-portal-ink"
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
        ) : null}

        {filtered.map((action) => (
          <ActionCard
            key={action.id}
            teamId={props.teamId}
            appId={props.appId}
            action={action}
          />
        ))}
      </div>

      {props.canCreate && dialogOpen ? (
        <CreateActionDialogV4 open={dialogOpen} onClose={handleDialogClose} />
      ) : null}
    </>
  );
};
