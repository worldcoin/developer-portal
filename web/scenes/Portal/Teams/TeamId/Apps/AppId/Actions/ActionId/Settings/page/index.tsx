"use client";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { isWorldId40Enabled, worldId40Atom } from "@/lib/feature-flags";
import { isLegacyActionsEditableForTeam } from "@/lib/feature-flags/world-id-4-0/common";
import { useAtomValue } from "jotai";
import Skeleton from "react-loading-skeleton";
import { TryAction } from "../TryAction";
import { UpdateActionForm } from "../UpdateAction";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";

type ActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
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
  const worldId40Config = useAtomValue(worldId40Atom);
  const isEnabled = isWorldId40Enabled(worldId40Config, teamId);
  const isReadOnly = isEnabled && !isLegacyActionsEditableForTeam(teamId);

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
            <TryAction action={action!} is_v4_action={false} />
          )}
        </div>
      </SizingWrapper>
    );
  }
};
