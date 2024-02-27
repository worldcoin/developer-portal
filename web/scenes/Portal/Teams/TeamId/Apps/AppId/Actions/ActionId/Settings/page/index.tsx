"use client";
import ErrorComponent from "next/error";
import Skeleton from "react-loading-skeleton";
import { ActionsHeader } from "../../Components/ActionsHeader";
import { TryAction } from "../TryAction";
import { UpdateActionForm } from "../UpdateAction";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";

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
      <div className="flex size-full flex-col items-center ">
        <div className="grid w-full max-w-[1180px] gap-y-2 py-10">
          <ActionsHeader
            actionId={actionID}
            teamId={teamId}
            appId={appId}
            learnMoreUrl="https://docs.worldcoin.org/id/idkit"
          />
          <hr className="my-5 w-full border-dashed text-grey-200" />
          <div className="grid w-full grid-cols-1 items-start justify-between gap-x-32 gap-y-10 md:grid-cols-1fr/auto">
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
