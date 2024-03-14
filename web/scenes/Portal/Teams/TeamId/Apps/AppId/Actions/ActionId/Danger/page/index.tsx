"use client";
import ErrorComponent from "next/error";
import Skeleton from "react-loading-skeleton";
import { ActionsHeader } from "../../Components/ActionsHeader";
import { ActionDangerZoneContent } from "../ActionDangerZoneContent";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";

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
  });

  const action = data?.action_by_pk;

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
        <div className="grid w-full gap-y-2 py-10">
          <ActionsHeader appId={appId} actionId={actionId} teamId={teamId} />

          <hr className="my-5 w-full border-dashed text-grey-200" />

          {loading ? (
            <Skeleton height={150} />
          ) : (
            <ActionDangerZoneContent
              action={action!}
              teamId={teamId}
              appId={appId}
            />
          )}
        </div>
      </div>
    );
  }
};

