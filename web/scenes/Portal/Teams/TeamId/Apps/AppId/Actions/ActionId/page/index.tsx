"use client";
import { EngineType } from "@/lib/types";
import ErrorComponent from "next/error";
import Skeleton from "react-loading-skeleton";
import { ActionsHeader } from "../Components/ActionsHeader";
import { ActionStatsGraph } from "./ActionStatsGraph";
import { VerifiedTable } from "./VerifiedTable";
import { useGetSingleActionAndNullifiersQuery } from "./graphql/client/get-single-action.generated";
import { SizingWrapper } from "@/components/SizingWrapper";

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
      <>
        <SizingWrapper gridClassName="order-1 pt-6 md:pt-10">
          <ActionsHeader appId={appId} actionId={actionId} teamId={teamId} />

          <hr className="mt-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pt-2 pb-6 md:pb-10">
          <div className="grid w-full grid-cols-1 items-start justify-between gap-y-10 lg:grid-cols-2 lg:gap-x-32">
            <ActionStatsGraph />

            {loading ? (
              <div>
                <Skeleton count={5} />
              </div>
            ) : (
              <VerifiedTable nullifiers={action?.nullifiers ?? []} />
            )}
          </div>
        </SizingWrapper>
      </>
    );
  }
};
