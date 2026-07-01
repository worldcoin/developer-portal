"use client";
import { use } from "react";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import Skeleton from "react-loading-skeleton";
import { useQuery } from "@apollo/client/react";
import { Debugger } from "../Debugger";
import { DebuggerDocument } from "./graphql/client/debugger.generated";

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
            <Skeleton count={5} />

            <Skeleton height={250} className="md:w-[480px]" />
          </div>
        ) : (
          <Debugger action={action!} appID={appId ?? ""} />
        )}
      </SizingWrapper>
    );
  }
};
