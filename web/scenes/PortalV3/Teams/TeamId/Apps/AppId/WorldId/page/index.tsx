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
    requestCreateActionSetup,
    consumeCreateAction,
    refreshOverview,
  } = useWorldIdLayout();

  return (
    <ActionsGrid
      actions={actions}
      teamId={teamId}
      appId={appId}
      search={actionsSearch}
      canCreate={canManageWorldId}
      initialDialogOpen={shouldOpenCreateAction}
      onCreateActionRequested={
        hasActiveRp ? undefined : requestCreateActionSetup
      }
      onCreateActionConsumed={consumeCreateAction}
      onActionsChanged={refreshOverview}
    />
  );
};
