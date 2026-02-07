"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { ErrorPage } from "@/components/ErrorPage";
import { useGetSingleActionV4Query } from "../../page/graphql/client/get-single-action-v4.generated";
import { UpdateActionV4Form } from "../UpdateActionV4Form";
import { TryAction } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/TryAction";
import { adaptActionV4ForTryAction } from "./utils/adapt-action-v4";
import Skeleton from "react-loading-skeleton";

type WorldIdActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
};

export const WorldIdActionIdSettingsPage = ({
  params,
}: WorldIdActionIdSettingsPageProps) => {
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
      <div className="grid w-full grid-cols-1 items-start justify-between gap-x-32 gap-y-10 md:grid-cols-1fr/auto">
        {loading ? (
          <Skeleton count={4} />
        ) : (
          <UpdateActionV4Form action={action!} appId={appId ?? ""} />
        )}

        {loading ? (
          <Skeleton className="md:w-[480px]" height={400} />
        ) : (
          <TryAction
            action={adaptActionV4ForTryAction({
              action: action!.action,
              description: action!.description,
              environment: "production",
              rp_registration: {
                app_id: action!.rp_registration.app_id,
              },
            })}
          />
        )}
      </div>
    </SizingWrapper>
  );
};
