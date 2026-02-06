"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { ErrorPage } from "@/components/ErrorPage";
import { useAtomValue } from "jotai";
import {
  worldId40Atom,
  isWorldId40Enabled,
} from "@/lib/feature-flags/world-id-4-0/client";
import { useGetSingleActionV4Query } from "../../page/graphql/client/get-single-action-v4.generated";
import { UpdateActionV4Form } from "../UpdateActionV4Form";

type WorldIdActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
};

export const WorldIdActionIdSettingsPage = ({
  params,
}: WorldIdActionIdSettingsPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  const worldId40Config = useAtomValue(worldId40Atom);
  const isFeatureEnabled = isWorldId40Enabled(worldId40Config, teamId);

  const { data, loading } = useGetSingleActionV4Query({
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_v4_by_pk;

  if (!loading && (!isFeatureEnabled || !action)) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage
          statusCode={404}
          title={!isFeatureEnabled ? "Feature not enabled" : "Action not found"}
        />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="order-1 pt-6 pb-6 md:pb-10">
      {loading ? (
        <div>Loading...</div>
      ) : action ? (
        <UpdateActionV4Form action={action} appId={appId ?? ""} />
      ) : null}
    </SizingWrapper>
  );
};
