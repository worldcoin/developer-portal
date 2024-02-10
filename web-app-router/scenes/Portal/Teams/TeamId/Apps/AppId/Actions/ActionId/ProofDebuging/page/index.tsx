"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { useDebuggerQuery } from "./graphql/client/debugger.generated";
import { Debugger } from "../Debugger";
import { Link } from "@/components/Link";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import ErrorComponent from "next/error";
import { ActionsHeader } from "../../Common/ActionsHeader";
import Skeleton from "react-loading-skeleton";

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
    context: { headers: { team_id: teamId } },
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
      <div className="w-full h-full flex flex-col items-center ">
        <div className="grid gap-y-2 max-w-[1180px] w-full py-10">
          <ActionsHeader actionId={actionID} teamId={teamId} appId={appId} />
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          {loading ? (
            <div className="grid grid-cols-1fr/auto gap-x-16">
              <Skeleton count={5} />
              <Skeleton height={250} className="md:w-[480px]" />
            </div>
          ) : (
            <Debugger action={action!} appID={appId ?? ""} />
          )}
        </div>
      </div>
    );
  }
};
