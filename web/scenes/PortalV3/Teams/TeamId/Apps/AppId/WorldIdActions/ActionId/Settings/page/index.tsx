"use client";
import { use } from "react";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import Skeleton from "react-loading-skeleton";
import { useGetSingleActionV4Query } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/graphql/client/get-single-action-v4.generated";
import { UpdateActionV4Form } from "../UpdateActionV4Form";

type WorldIdActionIdSettingsPageProps = {
  params: Promise<Record<string, string>>;
};

export const WorldIdActionIdSettingsPage = (
  props: WorldIdActionIdSettingsPageProps,
) => {
  const params = use(props.params);
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const { data, loading, error } = useGetSingleActionV4Query({
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_v4_by_pk;

  if (error) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={500} title="Failed to load action" />
      </SizingWrapper>
    );
  }

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="order-1 pt-6 pb-6 md:pb-10">
      <div className="grid w-full max-w-2xl gap-y-10">
        {loading ? (
          <Skeleton count={4} />
        ) : (
          <UpdateActionV4Form action={action!} appId={appId ?? ""} />
        )}
      </div>
    </SizingWrapper>
  );
};
