import { DecoratedButton } from "@/components/DecoratedButton";
import { getSdk as GetActionSdk } from "./graphql/server/get-single-action.generated";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { VerifiedTable } from "./VerifiedTable";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { Link } from "@/components/Link";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type ActionIdPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdPage = async ({ params }: ActionIdPageProps) => {
  const actionID = params?.actionId;
  const client = await getAPIServiceGraphqlClient();

  const data = await GetActionSdk(client).Action({
    action_id: actionID ?? "",
  });

  const action = data?.action[0];

  return (
    <div className="w-full h-full flex flex-col items-center ">
      <div className="grid gap-y-2 max-w-[1180px] w-full py-10">
        <div>
          <Link href="." className="flex flex-row items-center gap-x-2">
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
            href="https://docs.worldcoin.org/id/incognito-actions"
            className="text-grey-700 py-3 px-7 "
          >
            <DocsIcon />
            <Typography variant={TYPOGRAPHY.R3}>Learn more</Typography>
          </DecoratedButton>
        </div>
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <div className="w-full grid-cols-2 grid items-start justify-between gap-x-32">
          <div className="bg-green-50 h-50 w-50">Action Stats: TODO</div>
          <VerifiedTable nullifiers={action.nullifiers} />
        </div>
      </div>
    </div>
  );
};
