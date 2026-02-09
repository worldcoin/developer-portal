"use client";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import Skeleton from "react-loading-skeleton";
import { Debugger } from "../Debugger";
import { useDebuggerQuery } from "./graphql/client/debugger.generated";

type ActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdProofDebugingPage = ({
  params,
}: ActionIdSettingsPageProps) => {
  const appId = params?.appId;
  const teamId = params?.teamId;
  const actionID = params?.actionId;

  const { data, loading } = useDebuggerQuery({
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
