"use client";

import { CopyButton } from "@/components/CopyButton";
import { InformationCircleIcon } from "@/components/Icons/InformationCircleIcon";
import { Pagination } from "@/components/Pagination";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@apollo/client/react";
import { formatDistanceToNowStrict } from "date-fns";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { GetActionVerificationHistoryDocument } from "./graphql/client/get-action-verification-history.generated";

const rowsPerPageOptions = [5, 10, 20];

const formatNullifier = (nullifier: string) => {
  if (nullifier.length <= 22) {
    return nullifier;
  }

  return `${nullifier.slice(0, 10)}…${nullifier.slice(-8)}`;
};

export const VerificationHistory = (props: {
  actionId: string;
  appId: string;
}) => {
  const { actionId, appId } = props;
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const offset = (currentPage - 1) * rowsPerPage;

  const { data, previousData, loading, error } = useQuery(
    GetActionVerificationHistoryDocument,
    {
      variables: {
        action_id: actionId,
        app_id: appId,
        limit: rowsPerPage,
        offset,
      },
      skip: !actionId || !appId,
    },
  );

  const action = data?.action_v4[0] ?? previousData?.action_v4[0];
  const totalResults = Number(
    action?.nullifiers_aggregate.aggregate?.count ?? 0,
  );
  const pageCount = Math.max(1, Math.ceil(totalResults / rowsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [actionId]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  if (error) {
    return null;
  }

  if (!action && loading) {
    return (
      // The loaded card's chrome with its real heading; the content area
      // reserves the empty state's height, the shortest real variant.
      <section
        aria-hidden
        aria-busy
        className="rounded-16 border border-portal-border bg-white p-6 shadow-portal-card"
      >
        <div className="flex items-center gap-1.5">
          <Typography
            as="h2"
            variant={TYPOGRAPHY.H7}
            className="text-portal-heading"
          >
            Verification history
          </Typography>
          <InformationCircleIcon className="size-4 text-grey-300" />
        </div>

        <div className="flex min-h-44 flex-col items-center justify-center gap-2">
          <Skeleton width={176} />
          <Skeleton width={320} />
        </div>
      </section>
    );
  }

  const nullifiers = action?.nullifiers ?? [];

  return (
    <section
      aria-labelledby="verification-history-title"
      aria-busy={loading}
      className="rounded-16 border border-portal-border bg-white p-6 shadow-portal-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Typography
            id="verification-history-title"
            as="h2"
            variant={TYPOGRAPHY.H7}
            className="text-portal-heading"
          >
            Verification history
          </Typography>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="About verification history"
                className="rounded-full text-grey-300 outline-hidden transition-colors hover:text-grey-500 focus-visible:text-grey-500 focus-visible:ring-2 focus-visible:ring-grey-300"
              >
                <InformationCircleIcon className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={8}
              className="max-w-xs text-left leading-5"
            >
              <span className="block max-w-[280px] whitespace-normal">
                Each entry is created when your app successfully verifies a
                proof through the <code className="font-mono">/verify</code>{" "}
                endpoint for this action. Failed verification attempts aren’t
                shown.
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
        {totalResults > 0 ? (
          <Typography variant={TYPOGRAPHY.R4} className="text-portal-muted">
            {totalResults.toLocaleString()}{" "}
            {totalResults === 1 ? "verification" : "verifications"}
          </Typography>
        ) : null}
      </div>

      {totalResults === 0 ? (
        <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-4 text-center">
          <Typography
            as="h3"
            variant={TYPOGRAPHY.S2}
            className="text-portal-heading"
          >
            No verifications yet
          </Typography>
          <Typography
            variant={TYPOGRAPHY.R4}
            className="max-w-lg text-portal-muted"
          >
            Successful verifications will appear here after your app verifies a
            proof through the <code className="font-mono">/verify</code>{" "}
            endpoint for this action.
          </Typography>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto]">
            <div className="border-b border-grey-100 py-3 text-xs text-grey-400">
              Nullifier
            </div>
            <div className="border-b border-grey-100 py-3 pl-4 text-right text-xs text-grey-400">
              Verified at
            </div>

            {nullifiers.map((nullifier) => {
              const verifiedAt = formatDistanceToNowStrict(
                new Date(nullifier.created_at),
                { addSuffix: true },
              );

              return (
                <div
                  key={nullifier.id}
                  className="col-span-2 grid grid-cols-subgrid items-center border-b border-grey-100 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Typography
                      variant={TYPOGRAPHY.R3}
                      className="truncate font-ibm text-grey-700"
                      title={nullifier.nullifier}
                    >
                      {formatNullifier(nullifier.nullifier)}
                    </Typography>
                    <CopyButton
                      fieldName="Nullifier"
                      fieldValue={nullifier.nullifier}
                      className="shrink-0 !pr-0"
                      iconClassName="size-4 text-grey-500"
                    />
                  </div>
                  <Typography
                    variant={TYPOGRAPHY.R4}
                    className="pl-4 text-right whitespace-nowrap text-grey-500"
                    title={new Date(nullifier.created_at).toLocaleString()}
                  >
                    {verifiedAt}
                  </Typography>
                </div>
              );
            })}
          </div>

          <Pagination
            totalResults={totalResults}
            currentPage={currentPage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            handlePageChange={setCurrentPage}
            handleRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setCurrentPage(1);
            }}
          />
        </>
      )}
    </section>
  );
};
