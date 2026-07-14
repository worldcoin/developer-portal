"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import {
  GetActionVerificationsFeedQuery,
  useGetActionVerificationsFeedQuery,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/Actions/ActionId/page/graphql/client/get-action-verifications.generated";
import { NetworkStatus } from "@apollo/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { SettingsCard } from "./SettingsCard";
import { VerificationsFeed } from "./VerificationsFeed";

const PAGE_SIZE = 6;

type Action = GetActionVerificationsFeedQuery["action_v4"][number];

type Cursor = {
  createdAt: string;
  id: string;
};

const cursorKey = (cursor: Cursor | null) =>
  cursor ? `${cursor.createdAt}:${cursor.id}` : "first";

export const WorldIdActionDetailPage = (props: {
  params: Record<string, string>;
  canDelete: boolean;
}) => {
  const { params, canDelete } = props;
  const teamId = params.teamId;
  const appId = params.appId;
  const actionId = params.actionId;

  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<Array<Cursor | null>>([null]);
  const [pageCache, setPageCache] = useState<Record<string, Action>>({});
  const [deleted, setDeleted] = useState(false);
  const cursor = cursors[page] ?? null;
  const currentCursorKey = cursorKey(cursor);

  useEffect(() => {
    setPage(0);
    setCursors([null]);
    setPageCache({});
  }, [actionId, appId]);

  const nullifierWhere = useMemo(
    () =>
      cursor
        ? {
            _or: [
              { created_at: { _lt: cursor.createdAt } },
              {
                created_at: { _eq: cursor.createdAt },
                id: { _lt: cursor.id },
              },
            ],
          }
        : {},
    [cursor],
  );

  const { data, loading, error, networkStatus, refetch } =
    useGetActionVerificationsFeedQuery({
      variables: {
        action_id: actionId,
        app_id: appId,
        limit: PAGE_SIZE + 1,
        nullifier_where: nullifierWhere,
      },
      skip: !actionId,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
      pollInterval: page === 0 ? 5000 : 0,
      skipPollAttempt: () => typeof document !== "undefined" && document.hidden,
      onCompleted: (result) => {
        const resultAction = result.action_v4[0];
        if (!resultAction) {
          setPageCache({});
          return;
        }
        setPageCache((current) => ({
          ...current,
          [currentCursorKey]: resultAction,
        }));
      },
    });

  const queriedAction = data?.action_v4?.[0];
  const cachedPageAction = pageCache[currentCursorKey];
  const actionForPage =
    networkStatus !== NetworkStatus.setVariables &&
    queriedAction?.id === actionId
      ? queriedAction
      : cachedPageAction?.id === actionId
        ? cachedPageAction
        : undefined;
  const action =
    actionForPage ?? Object.values(pageCache).find(({ id }) => id === actionId);

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

  const nullifiers = actionForPage?.nullifiers.slice(0, PAGE_SIZE) ?? [];
  const hasNextPage = (actionForPage?.nullifiers.length ?? 0) > PAGE_SIZE;

  const handleNextPage = () => {
    const lastNullifier = nullifiers.at(-1);
    if (!hasNextPage || !lastNullifier) {
      return;
    }

    const nextCursor = {
      createdAt: lastNullifier.created_at,
      id: lastNullifier.id,
    };
    setCursors((current) => [...current.slice(0, page + 1), nextCursor]);
    setPage((current) => current + 1);
  };

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

        {!actionForPage ? (
          loading || networkStatus === NetworkStatus.setVariables ? (
            <div className="rounded-16 border border-portal-border bg-white p-4 shadow-portal-card">
              <Skeleton height={40} count={6} />
            </div>
          ) : (
            <div className="rounded-16 border border-portal-border bg-white px-4 py-12 text-center font-world text-13 text-portal-muted shadow-portal-card">
              Failed to load verifications.{" "}
              <button
                type="button"
                className="font-medium text-portal-heading underline"
                onClick={() => void refetch()}
              >
                Retry
              </button>
            </div>
          )
        ) : (
          <VerificationsFeed
            nullifiers={nullifiers}
            page={page + 1}
            hasPreviousPage={page > 0}
            hasNextPage={hasNextPage}
            onPreviousPage={() => setPage((current) => current - 1)}
            onNextPage={handleNextPage}
          />
        )}

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
