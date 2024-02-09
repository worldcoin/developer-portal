"use client";
import { UpdateActionForm } from "../UpdateAction";
import { TryAction } from "../TryAction";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";
import { ActionsHeader } from "../../Common/ActionsHeader";
import ErrorComponent from "next/error";
import Skeleton from "react-loading-skeleton";

type ActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdSettingsPage = ({ params }: ActionIdSettingsPageProps) => {
  const actionID = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const { data, loading } = useGetSingleActionQuery({
    variables: {
      action_id: actionID ?? "",
    },
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
          <ActionsHeader actionId={actionID} teamId={teamId} appId={appId} />
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          <div className="w-full grid-cols-1fr/auto grid items-start justify-between gap-x-32">
            {loading ? (
              <Skeleton count={4} />
            ) : (
              // Only possible if action is defined
              <UpdateActionForm action={action!} teamId={teamId ?? ""} />
            )}
            {loading ? (
              <Skeleton className="md:w-[480px]" height={400} />
            ) : (
              <TryAction action={action!} />
            )}
          </div>
        </div>
      </div>
    );
  }
};
