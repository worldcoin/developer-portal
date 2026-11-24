"use client";
import { use } from "react";
import { EngineType } from "@/lib/types";
import { ErrorPage } from "@/components/ErrorPage";
import { SkeletonTable } from "@/components/Skeletons";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ActionStatsGraph } from "./ActionStatsGraph";
import { VerifiedTable } from "./VerifiedTable";
import { GetSingleActionAndNullifiersDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/ActionId/page/graphql/client/get-single-action.generated";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useQuery } from "@apollo/client/react";

type ActionIdPageProps = {
  params: Promise<Record<string, string>>;
};

export const ActionIdPage = (props: ActionIdPageProps) => {
  const params = use(props.params);
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const { data, loading } = useQuery(GetSingleActionAndNullifiersDocument, {
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action[0];

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  } else if (data?.action[0]?.app.engine === EngineType.OnChain) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={401} title="No Access" />
      </SizingWrapper>
    );
  } else {
    return (
      <SizingWrapper gridClassName="pt-6 pb-6 md:pb-10">
        <div className="grid w-full grid-cols-1 items-start justify-between gap-y-10 lg:grid-cols-2 lg:gap-x-32">
          <ActionStatsGraph />

          {loading ? (
            <div className="grid w-full gap-y-6">
              <Typography variant={TYPOGRAPHY.H7} className="mt-6">
                Verified humans
              </Typography>
              <SkeletonTable columns={["Human", "Uses", "Time"]} rows={5} />
            </div>
          ) : (
            <VerifiedTable
              columns={["human", "uses", "time"]}
              nullifiers={action?.nullifiers ?? []}
            />
          )}
        </div>
      </SizingWrapper>
    );
  }
};
