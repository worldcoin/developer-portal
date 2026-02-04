"use client";
import { ErrorPage } from "@/components/ErrorPage";
import Skeleton from "react-loading-skeleton";
import { ActionsHeader } from "../../Components/ActionsHeader";
import { ActionDangerZoneContent } from "../ActionDangerZoneContent";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";
import { SizingWrapper } from "@/components/SizingWrapper";

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
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  } else {
    return (
      <>
        <SizingWrapper gridClassName="order-1 pt-6 md:pt-10">
          <ActionsHeader appId={appId} actionId={actionId} teamId={teamId} />

          <hr className="mt-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pt-2 pb-6 md:pb-10">
          {loading ? (
            <Skeleton height={150} />
          ) : (
            <ActionDangerZoneContent
              action={action!}
              teamId={teamId}
              appId={appId}
            />
          )}
        </SizingWrapper>
      </>
    );
  }
};
