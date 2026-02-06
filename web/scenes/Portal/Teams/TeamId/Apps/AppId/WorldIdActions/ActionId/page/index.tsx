"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  isWorldId40Enabled,
  worldId40Atom,
} from "@/lib/feature-flags/world-id-4-0/client";
import { useAtomValue } from "jotai";
import Skeleton from "react-loading-skeleton";
import { useGetSingleActionV4Query } from "./graphql/client/get-single-action-v4.generated";

type WorldIdActionIdPageProps = {
  params: Record<string, string> | null | undefined;
};

export const WorldIdActionIdPage = ({ params }: WorldIdActionIdPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const worldId40Config = useAtomValue(worldId40Atom);
  const isFeatureEnabled = isWorldId40Enabled(worldId40Config, teamId);

  const { data, loading } = useGetSingleActionV4Query({
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_v4_by_pk;

  if (!loading && (!isFeatureEnabled || !action)) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage
          statusCode={404}
          title={!isFeatureEnabled ? "Feature not enabled" : "Action not found"}
        />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="order-1 pt-2 pb-6 md:pb-10">
      <div className="grid w-full gap-y-6">
        <Typography variant={TYPOGRAPHY.H7}>Overview</Typography>

        <div className="grid gap-y-4">
          <div className="rounded-lg border border-grey-100 p-6">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Total Verifications
            </Typography>
            <Typography variant={TYPOGRAPHY.H6} className="mt-2">
              {loading ? (
                <Skeleton width={100} />
              ) : (
                Number(
                  action?.nullifiers_aggregate?.aggregate?.count ?? 0,
                ).toLocaleString()
              )}
            </Typography>
          </div>

          <div className="rounded-lg border border-grey-100 p-6">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Environment
            </Typography>
            <div className="mt-2 flex items-center gap-x-2">
              {loading ? (
                <Skeleton width={100} />
              ) : (
                <>
                  {(() => {
                    const environment =
                      (action?.environment as "staging" | "production") ||
                      "staging";
                    const isProduction = environment === "production";
                    return (
                      <>
                        <div
                          className={`size-2 rounded-full ${
                            isProduction ? "bg-green-500" : "bg-yellow-500"
                          }`}
                        />
                        <Typography
                          variant={TYPOGRAPHY.H7}
                          className="capitalize"
                        >
                          {isProduction ? "Production" : "Staging"}
                        </Typography>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-grey-100 p-6">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Description
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="mt-2">
              {loading ? (
                <Skeleton count={2} />
              ) : action?.description ? (
                action.description
              ) : (
                <span className="italic text-grey-400">
                  No description provided
                </span>
              )}
            </Typography>
          </div>
        </div>
      </div>
    </SizingWrapper>
  );
};
