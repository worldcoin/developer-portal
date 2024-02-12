"use client";
import { ActionDangerZoneContent } from "../ActionDangerZoneContent";
import ErrorComponent from "next/error";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";
import { ActionsHeader } from "../../Common/ActionsHeader";
import Skeleton from "react-loading-skeleton";

type ActionIdDangerPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdDangerPage = ({ params }: ActionIdDangerPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const { data, loading } = useGetSingleActionQuery({
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
        <div className="grid gap-y-2 w-full py-10">
          <ActionsHeader appId={appId} actionId={actionId} teamId={teamId} />
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          {loading ? (
            <Skeleton height={150} />
          ) : (
            <ActionDangerZoneContent action={action!} teamId={teamId} />
          )}
        </div>
      </div>
    );
  }
};
