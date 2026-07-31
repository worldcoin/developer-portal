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
import { GetAppDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/app.generated";
import { useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect } from "react";
import { LegacyActionsGrid } from "./LegacyActionsGrid";

const EMPTY_ACTIONS: GetActionsQuery["actions"] = [];

type LegacyActionsPageProps = {
  params: Promise<{ teamId: string; appId: string }>;
};

export const LegacyActionsPage = (props: LegacyActionsPageProps) => {
  const params = use(props.params);
  const router = useRouter();
  const { actionsSearch } = useWorldIdLayout();

  const appResult = useQuery(GetAppDocument, {
    variables: { app_id: params.appId },
    skip: !params.appId,
  });
  const actionsResult = useQuery(GetActionsDocument, {
    variables: {
      app_id: params.appId,
      condition: {},
    },
    skip: !params.appId,
  });

  const actions = actionsResult.data?.actions ?? EMPTY_ACTIONS;
  const app = appResult.data?.app;
  const hasApp = Boolean(app);
  const loading = appResult.loading || actionsResult.loading;

  useEffect(() => {
    if (
      loading ||
      appResult.error ||
      actionsResult.error ||
      !hasApp ||
      actions.length > 0
    ) {
      return;
    }

    router.replace(
      urls.worldId({
        team_id: params.teamId,
        app_id: params.appId,
      }),
    );
  }, [
    actions.length,
    actionsResult.error,
    appResult.error,
    hasApp,
    loading,
    params.appId,
    params.teamId,
    router,
  ]);

  const getActionHref = useCallback(
    (action: (typeof actions)[number]) => {
      const basePath = `${urls.actions({
        team_id: params.teamId,
        app_id: params.appId,
      })}/${action.id}`;

      return app?.engine === EngineType.OnChain
        ? `${basePath}/settings`
        : basePath;
    },
    [app?.engine, params.appId, params.teamId],
  );

  if (
    (appResult.error && !appResult.data) ||
    (actionsResult.error && !actionsResult.data)
  ) {
    return <ErrorPage statusCode={500} title="Failed to load legacy actions" />;
  }

  if (!appResult.loading && !app) {
    return <ErrorPage statusCode={404} title="App not found" />;
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
