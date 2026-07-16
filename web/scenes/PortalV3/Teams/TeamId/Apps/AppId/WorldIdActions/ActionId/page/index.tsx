"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import {
  GetWorldIdActionDetailQuery,
  useGetWorldIdActionDetailQuery,
} from "./graphql/client/get-world-id-action-detail.generated";
import { VerifiedTable } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page/VerifiedTable";
import { adaptNullifierV4 } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/utils/adapt-nullifier-v4";
import Link from "next/link";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { SettingsCard } from "./SettingsCard";

type Action = GetWorldIdActionDetailQuery["action_v4"][number];

export const WorldIdActionDetailPage = (props: {
  params: Record<string, string>;
  canModify: boolean;
}) => {
  const { params, canModify } = props;
  const teamId = params.teamId;
  const appId = params.appId;
  const actionId = params.actionId;

  const [deleted, setDeleted] = useState(false);
  const { data, loading, error, refetch } = useGetWorldIdActionDetailQuery({
    variables: { action_id: actionId, app_id: appId },
    skip: !actionId || !appId,
  });
  const action: Action | undefined = data?.action_v4[0];

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
            href={urls.worldId40({ team_id: teamId, app_id: appId })}
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

        {action ? (
          <div className="rounded-16 border border-portal-border bg-white p-6 shadow-portal-card">
            <div className="flex flex-col gap-1">
              <span className="font-world text-sm text-portal-muted">
                Verifications
              </span>
              <span className="font-ibm text-[28px] leading-none font-medium text-portal-heading">
                {Number(
                  action.nullifiers_aggregate?.aggregate?.count ?? 0,
                ).toLocaleString()}
              </span>
            </div>
            <VerifiedTable
              columns={["human", "time"]}
              nullifiers={adaptNullifierV4(action.nullifiers)}
              showIcons={false}
              showCount={false}
            />
          </div>
        ) : null}

        {action && canModify ? (
          <SettingsCard
            action={action}
            teamId={teamId}
            appId={appId}
            canModify={canModify}
            onDeleted={() => setDeleted(true)}
            onUpdated={() => void refetch().catch(() => {})}
          />
        ) : null}
      </div>
    </SizingWrapper>
  );
};
