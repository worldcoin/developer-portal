"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { useDebuggerQuery } from "./graphql/client/debugger.generated";
import { Debugger } from "../Debugger";
import { Link } from "@/components/Link";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import ErrorComponent from "next/error";

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

  if (loading) return <div></div>;
  else if (!action) {
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
          <div>
            <Link href=".." className="flex flex-row items-center gap-x-2">
              <CaretIcon className="h-3 w-3 text-grey-400 rotate-90" />
              <Typography variant={TYPOGRAPHY.R5} className="text-grey-700">
                Back to Incognito Actions
              </Typography>
            </Link>
          </div>
          <div className="w-full flex justify-between items-center">
            <Typography
              variant={TYPOGRAPHY.H6}
              className="text-grey-900 capitalize"
            >
              {action.name}
            </Typography>

            <DecoratedButton
              variant="secondary"
              href="https://docs.worldcoin.org/id/cloud"
              className="text-grey-700 py-3 px-7 "
            >
              <DocsIcon />
              <Typography variant={TYPOGRAPHY.R3}>Learn more</Typography>
            </DecoratedButton>
          </div>
          <hr className="my-5 w-full text-grey-200 border-dashed" />
          <Debugger action={action} appID={appId ?? ""} />
        </div>
      </div>
    );
  }
};
