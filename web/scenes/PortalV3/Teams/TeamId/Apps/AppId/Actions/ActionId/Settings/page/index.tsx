"use client";
import { use } from "react";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { isLegacyActionsEditableForTeam } from "@/lib/feature-flags/world-id-4-0/common";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@apollo/client/react";
import { TryAction } from "../TryAction";
import { UpdateActionForm } from "../UpdateAction";
import { GetSingleActionDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/page/graphql/client/get-single-action.generated";

type ActionIdSettingsPageProps = {
  params: Promise<Record<string, string>>;
};

export const ActionIdSettingsPage = (props: ActionIdSettingsPageProps) => {
  const params = use(props.params);
  const actionID = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const { data, loading } = useQuery(GetSingleActionDocument, {
    variables: {
      action_id: actionID ?? "",
    },
  });

  const action = data?.action[0];
  const isReadOnly = !isLegacyActionsEditableForTeam(teamId);

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  } else {
    return (
      <SizingWrapper gridClassName="pt-6 pb-6 md:pb-10">
        <div className="grid w-full grid-cols-1 items-start justify-between gap-x-32 gap-y-10 md:grid-cols-1fr/auto">
          {loading ? (
            <Skeleton count={4} />
          ) : (
            // Only possible if action is defined
            <UpdateActionForm
              action={action!}
              teamId={teamId ?? ""}
              isReadOnly={isReadOnly}
            />
          )}

          {loading ? (
            <Skeleton className="md:w-[480px]" height={400} />
          ) : (
            <TryAction
              action={action!}
              is_v4_action={false}
              enableKiosk={false}
            />
          )}
        </div>
      </SizingWrapper>
    );
  }
};
