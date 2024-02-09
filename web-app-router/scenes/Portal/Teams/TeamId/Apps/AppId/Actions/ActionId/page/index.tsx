"use client";
import { VerifiedTable } from "./VerifiedTable";
import ErrorComponent from "next/error";
import { useGetSingleActionAndNullifiersQuery } from "./graphql/client/get-single-action.generated";
import { ActionsHeader } from "../Common/ActionsHeader";
import Skeleton from "react-loading-skeleton";

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
  } else {
    return (
      <div className="w-full h-full flex flex-col items-center ">
        <div className="grid gap-y-2 max-w-[1180px] w-full py-10">
          <ActionsHeader appId={appId} actionId={actionId} teamId={teamId} />
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          <div className="w-full grid-cols-2 grid items-start justify-between gap-x-32">
            <div className="bg-green-50 h-50 w-50">Action Stats: TODO</div>
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
