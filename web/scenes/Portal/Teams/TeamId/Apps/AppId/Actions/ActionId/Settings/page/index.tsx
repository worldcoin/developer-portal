"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { ErrorPage } from "@/components/ErrorPage";
import Skeleton from "react-loading-skeleton";
import { TryAction } from "../TryAction";
import { UpdateActionForm } from "../UpdateAction";
import { useGetSingleActionQuery } from "./graphql/client/get-single-action.generated";
import { useAtomValue } from "jotai";
import { worldId40Atom, isWorldId40Enabled } from "@/lib/feature-flags";

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
              isReadOnly={isEnabled}
            />
          )}

          {loading ? (
            <Skeleton className="md:w-[480px]" height={400} />
          ) : (
            <TryAction action={action!} />
          )}
        </div>
      </SizingWrapper>
    );
  }
};
