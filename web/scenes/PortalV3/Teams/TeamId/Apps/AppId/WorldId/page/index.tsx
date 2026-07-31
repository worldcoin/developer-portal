"use client";

import { useState } from "react";
import { useWorldIdLayout } from "../layout/context";
import { ActionsGrid } from "./ActionsGrid";
import { ActionsSearch } from "./ActionsSearch";

export const WorldIdActionsPage = () => {
  const [search, setSearch] = useState("");
  const {
    teamId,
    appId,
    canManageWorldId,
    actions,
    hasActiveRp,
    shouldOpenCreateAction,
    requestCreateActionSetup,
    consumeCreateAction,
    refreshOverview,
  } = useWorldIdLayout();

  return (
    <div className="flex flex-col gap-6">
      <ActionsSearch
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <ActionsGrid
        actions={actions}
        teamId={teamId}
        appId={appId}
        search={search}
        canCreate={canManageWorldId}
        initialDialogOpen={shouldOpenCreateAction}
        onCreateActionRequested={
          hasActiveRp ? undefined : requestCreateActionSetup
        }
        onCreateActionConsumed={consumeCreateAction}
        onActionsChanged={refreshOverview}
      />
    </div>
  );
};
