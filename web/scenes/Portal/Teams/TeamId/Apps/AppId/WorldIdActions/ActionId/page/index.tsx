"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Skeleton from "react-loading-skeleton";
import { useGetSingleActionV4Query } from "./graphql/client/get-single-action-v4.generated";
import { VerifiedTable } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/page/VerifiedTable";
import { adaptNullifierV4 } from "./utils/adapt-nullifier-v4";

type WorldIdActionIdPageProps = {
  params: Record<string, string> | null | undefined;
};

export const WorldIdActionIdPage = ({ params }: WorldIdActionIdPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const { data, loading } = useGetSingleActionV4Query({
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_v4_by_pk;

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="order-1 pt-6 pb-6 md:pb-10">
      <div className="grid w-full grid-cols-1 items-start justify-between gap-y-10 lg:grid-cols-2 lg:gap-x-32">
        {/* Left: Stats overview */}
        <div className="grid gap-y-6">
          <Typography className="block" variant={TYPOGRAPHY.H7}>
            Overview
          </Typography>

          {/* Stats summary */}
          <div className="flex flex-col gap-y-6">
            {/* Verifications stat */}
            <div>
              <div className="grid grid-cols-auto/1fr items-center gap-x-1">
                <div className="size-1.5 rounded-[1px] bg-blue-500" />
                <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
                  Verifications
                </Typography>
              </div>
              <div className="mt-1 flex items-center gap-x-2">
                <Typography variant={TYPOGRAPHY.H6} className="text-grey-700">
                  {loading ? (
                    <Skeleton width={100} />
                  ) : (
                    Number(
                      action?.nullifiers_aggregate?.aggregate?.count ?? 0,
                    ).toLocaleString()
                  )}
                </Typography>
              </div>
            </div>
          </div>

          {/* Placeholder for future graph */}
          <div className="pointer-events-none grid aspect-[580/350] w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-500">
              Detailed analytics coming soon
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
              Verification trends will show up here
            </Typography>
          </div>
        </div>

        {/* Right: Verified humans table */}
        {loading ? (
          <div>
            <Skeleton count={5} />
          </div>
        ) : (
          <VerifiedTable
            columns={["human", "time"]}
            nullifiers={adaptNullifierV4(action?.nullifiers ?? [])}
          />
        )}
      </div>
    </SizingWrapper>
  );
};
