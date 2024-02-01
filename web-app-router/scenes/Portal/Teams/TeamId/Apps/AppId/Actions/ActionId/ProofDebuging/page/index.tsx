import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { getSdk as GetActionSdk } from "./graphql/server/debugger.generated";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Debugger } from "../Debugger";
import { Link } from "@/components/Link";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type ActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdProofDebugingPage = async ({
  params,
}: ActionIdSettingsPageProps) => {
  const appID = params?.appId;
  const actionID = params?.actionId;

  const client = await getAPIServiceGraphqlClient();
  const data = await GetActionSdk(client).Debugger({
    action_id: actionID ?? "",
  });

  const action = data?.action[0];

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
        <Debugger action={action} appID={appID ?? ""} />
      </div>
    </div>
  );
};
