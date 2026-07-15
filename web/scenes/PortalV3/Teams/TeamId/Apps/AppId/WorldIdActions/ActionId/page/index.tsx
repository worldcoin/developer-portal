"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import {
  GetWorldIdOverviewQuery,
  useGetWorldIdOverviewQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/page/graphql/client/get-world-id-overview.generated";
import Link from "next/link";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { SettingsCard } from "./SettingsCard";

type Action = GetWorldIdOverviewQuery["action_v4"][number];

export const WorldIdActionDetailPage = (props: {
  params: Record<string, string>;
  canDelete: boolean;
}) => {
  const { params, canDelete } = props;
  const teamId = params.teamId;
  const appId = params.appId;
  const actionId = params.actionId;

  const [deleted, setDeleted] = useState(false);
  const { data, loading, error, refetch } = useGetWorldIdOverviewQuery({
    variables: { app_id: appId },
    skip: !appId,
  });
  const action: Action | undefined = data?.action_v4.find(
    ({ id }) => id === actionId,
  );

  if (error && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={500} title="Failed to load action" />
      </SizingWrapper>
    );
  }

  if (!loading && !error && !action && !deleted) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="pb-6 pt-6 md:pb-10">
      <div className="mx-auto flex w-full max-w-[900px] flex-col gap-4">
        <div className="flex items-baseline gap-2.5">
          <Link
            href={urls.worldId({ team_id: teamId, app_id: appId })}
            className="font-world text-13 text-portal-muted transition-colors hover:text-portal-text"
          >
            Actions
          </Link>
          <span className="font-world text-13 text-portal-subtle">/</span>
          {!action ? (
            <Skeleton width={120} />
          ) : (
            <span className="font-ibm text-13 font-medium text-portal-heading">
              {action.action}
            </span>
          )}
        </div>

        <div className="rounded-16 border border-portal-border bg-white p-6 shadow-portal-card">
          {!action ? (
            <Skeleton height={48} />
          ) : (
            <div className="flex flex-col gap-2">
              <span className="font-ibm text-[20px] leading-none font-medium text-portal-heading">
                {action.action}
              </span>
              {action.description ? (
                <span className="font-world text-sm text-portal-muted">
                  {action.description}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {action && canDelete ? (
          <SettingsCard
            action={action}
            teamId={teamId}
            appId={appId}
            canDelete={canDelete}
            onDeleted={() => setDeleted(true)}
            onUpdated={() => void refetch().catch(() => {})}
          />
        ) : null}
      </div>
    </SizingWrapper>
  );
};
