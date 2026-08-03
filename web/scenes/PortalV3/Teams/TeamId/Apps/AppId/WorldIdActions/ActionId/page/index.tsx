"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { WORLD_ID_TABS } from "@/lib/world-id-tabs";
import { useQuery } from "@apollo/client/react";
import {
  GetWorldIdActionDetailDocument,
  GetWorldIdActionDetailQuery,
} from "./graphql/client/get-world-id-action-detail.generated";
import Link from "next/link";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { DeleteAction } from "./DeleteAction";
import { VerificationHistory } from "./VerificationHistory";
import { UpdateActionV4Form } from "../Settings/UpdateActionV4Form";

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
  const { data, loading, error, refetch } = useQuery(
    GetWorldIdActionDetailDocument,
    {
      variables: { action_id: actionId, app_id: appId },
      skip: !actionId || !appId,
    },
  );
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
            href={urls.worldIdTab({
              team_id: teamId,
              app_id: appId,
              tab: WORLD_ID_TABS.Actions,
            })}
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

        {action ? (
          <UpdateActionV4Form
            key={action.id}
            action={action}
            appId={appId}
            canModify={canModify}
            onUpdated={() => void refetch().catch(() => {})}
          />
        ) : (
          <div className="grid gap-4 rounded-16 border border-portal-border bg-white p-5 shadow-portal-card md:grid-cols-2">
            <Skeleton height={48} />
            <Skeleton height={48} />
          </div>
        )}

        <VerificationHistory actionId={actionId} appId={appId} />

        {action && canModify ? (
          <DeleteAction
            action={action}
            teamId={teamId}
            appId={appId}
            canModify={canModify}
            onDeleted={() => setDeleted(true)}
          />
        ) : null}
      </div>
    </SizingWrapper>
  );
};
