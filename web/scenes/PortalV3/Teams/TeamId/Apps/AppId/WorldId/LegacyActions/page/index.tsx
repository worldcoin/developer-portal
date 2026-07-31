"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType } from "@/lib/types";
import { urls } from "@/lib/urls";
import { useWorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/layout/context";
import { ActionCardSkeleton } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard/Skeleton";
import {
  GetActionsDocument,
  type GetActionsQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/actions.generated";
import { useQuery } from "@apollo/client/react";
import { useCallback, useEffect } from "react";
import { LegacyActionsGrid } from "./LegacyActionsGrid";

const EMPTY_ACTIONS: GetActionsQuery["actions"] = [];

export const LegacyActionsPage = () => {
  const { teamId, appId, appEngine, actionsSearch, refreshOverview } =
    useWorldIdLayout();
  const actionsResult = useQuery(GetActionsDocument, {
    variables: {
      app_id: appId,
      condition: {},
    },
    skip: !appId,
  });

  const actions = actionsResult.data?.actions ?? EMPTY_ACTIONS;
  const loading = actionsResult.loading;

  useEffect(() => {
    if (loading || actionsResult.error || actions.length > 0) return;
    refreshOverview();
  }, [actions.length, actionsResult.error, loading, refreshOverview]);

  const getActionHref = useCallback(
    (action: (typeof actions)[number]) => {
      const basePath = `${urls.actions({
        team_id: teamId,
        app_id: appId,
      })}/${action.id}`;

      return appEngine === EngineType.OnChain
        ? `${basePath}/settings`
        : basePath;
    },
    [appEngine, appId, teamId],
  );

  if (actionsResult.error && !actionsResult.data) {
    return <ErrorPage statusCode={500} title="Failed to load legacy actions" />;
  }

  if (!loading && actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <Notification variant="warning">
        <div className="text-system-warning-800">
          <Typography as="p" variant={TYPOGRAPHY.S3}>
            This functionality is deprecated in 4.0. It's still viewable for
            your convenience. Please make all new actions in the 4.0 view.
          </Typography>
        </div>
      </Notification>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCardSkeleton />
          <ActionCardSkeleton />
          <ActionCardSkeleton />
        </div>
      ) : (
        <LegacyActionsGrid
          actions={actions}
          search={actionsSearch}
          getActionHref={getActionHref}
        />
      )}
    </div>
  );
};
