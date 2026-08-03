"use client";

import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { LegacyActionsPage } from "../LegacyActions/page";
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
      emptyReason={
        canManageWorldId
          ? "Finish registering your relying party to create actions."
          : "Ask a team owner or admin to create actions."
      }
      initialDialogOpen={shouldOpenCreateAction}
      onCreateActionConsumed={consumeCreateAction}
      onActionsChanged={refreshOverview}
    />
  );
};

export const WorldIdPage = () => {
  const { activeTab } = useWorldIdLayout();

  if (activeTab === WORLD_ID_TABS.Actions) return <WorldIdActionsPage />;
  if (activeTab === WORLD_ID_TABS.LegacyActions) {
    return <LegacyActionsPage />;
  }

  return null;
};
