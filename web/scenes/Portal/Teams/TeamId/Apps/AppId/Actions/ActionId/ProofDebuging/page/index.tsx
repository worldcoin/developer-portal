"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import ErrorComponent from "next/error";
import Skeleton from "react-loading-skeleton";
import { ActionsHeader } from "../../Components/ActionsHeader";
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
      <ErrorComponent
        statusCode={404}
        title="Action not found"
      ></ErrorComponent>
    );
  } else {
    return (
      <>
        <SizingWrapper gridClassName="order-1 pt-6 md:pt-10">
          <ActionsHeader
            actionId={actionID}
            teamId={teamId}
            appId={appId}
            learnMoreUrl="https://docs.world.org/reference/api#verify-proof"
          />

          <hr className="mt-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pt-2 pb-6 md:pb-10">
          {loading ? (
            <div className="grid grid-cols-1fr/auto gap-x-16">
              <Skeleton count={5} />

              <Skeleton height={250} className="md:w-[480px]" />
            </div>
          ) : (
            <Debugger action={action!} appID={appId ?? ""} />
          )}
        </SizingWrapper>
      </>
    );
  }
};
