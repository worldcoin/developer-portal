"use client";
import { use } from "react";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { SkeletonCard, SkeletonForm } from "@/components/Skeletons";
import { useQuery } from "@apollo/client/react";
import { Debugger } from "../Debugger";
import { DebuggerDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/ActionId/ProofDebuging/page/graphql/client/debugger.generated";

type ActionIdSettingsPageProps = {
  params: Promise<Record<string, string>>;
};

export const ActionIdProofDebugingPage = (props: ActionIdSettingsPageProps) => {
  const params = use(props.params);
  const appId = params?.appId;
  const teamId = params?.teamId;
  const actionID = params?.actionId;

  const { data, loading } = useQuery(DebuggerDocument, {
    variables: {
      action_id: actionID ?? "",
    },
  });

  const action = data?.action[0];

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  } else {
    return (
      <SizingWrapper gridClassName="pt-6 pb-6 md:pb-10">
        {loading ? (
          <div className="grid grid-cols-1fr/auto gap-x-16">
            <SkeletonForm count={5} className="w-full max-w-[580px]" />

            <SkeletonCard className="h-[250px] md:w-[480px]" lines={3} />
          </div>
        ) : (
          <Debugger action={action!} appID={appId ?? ""} />
        )}
      </SizingWrapper>
    );
  }
};
