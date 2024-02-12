"use client";
import { VerifiedTable } from "./VerifiedTable";
import ErrorComponent from "next/error";
import { useGetSingleActionAndNullifiersQuery } from "./graphql/client/get-single-action.generated";
import { ActionsHeader } from "../Common/ActionsHeader";
import Skeleton from "react-loading-skeleton";
import { ActionStatsGraph } from "./ActionStatsGraph";
import { EngineType } from "@/lib/types";

type ActionIdPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdPage = ({ params }: ActionIdPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const { data, loading } = useGetSingleActionAndNullifiersQuery({
    variables: { action_id: actionId ?? "" },
    context: { headers: { team_id: teamId } },
  });

  const action = data?.action[0];

  if (!loading && !action) {
    return (
      <ErrorComponent
        statusCode={404}
        title="Action not found"
      ></ErrorComponent>
    );
  } else if (data?.action[0]?.app.engine === EngineType.OnChain) {
    return <ErrorComponent statusCode={401} title="No Access"></ErrorComponent>;
  } else {
    return (
      <div className="w-full h-full flex flex-col items-center ">
        <div className="grid gap-y-2 max-w-[1180px] w-full py-10">
          <ActionsHeader appId={appId} actionId={actionId} teamId={teamId} />
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          <div className="w-full md:grid-cols-2 grid items-start justify-between gap-x-32 gap-y-10 grid-cols-1">
            <ActionStatsGraph />
            {loading ? (
              <div>
                <Skeleton count={5} />
              </div>
            ) : (
              <VerifiedTable nullifiers={action?.nullifiers ?? []} />
            )}
          </div>
        </div>
      </div>
    );
  }
};
