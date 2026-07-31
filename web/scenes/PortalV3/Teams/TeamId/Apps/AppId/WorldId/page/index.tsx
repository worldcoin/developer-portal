"use client";

import { useWorldIdLayout } from "../layout/context";
import { ActionsGrid } from "./ActionsGrid";

export const WorldIdActionsPage = () => {
  const {
    teamId,
    appId,
    canManageWorldId,
    actions,
    actionsSearch,
    hasActiveRp,
    shouldOpenCreateAction,
    consumeCreateAction,
    refreshOverview,
  } = useWorldIdLayout();

  return (
    <ActionsGrid
      actions={actions}
      teamId={teamId}
      appId={appId}
      search={actionsSearch}
      canCreate={canManageWorldId && hasActiveRp}
      initialDialogOpen={shouldOpenCreateAction}
      onCreateActionConsumed={consumeCreateAction}
      onActionsChanged={refreshOverview}
    />
  );
};
