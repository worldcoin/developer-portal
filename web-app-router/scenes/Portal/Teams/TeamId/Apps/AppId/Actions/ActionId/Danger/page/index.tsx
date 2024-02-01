import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import Link from "next/link";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { getSdk as GetActionSdk } from "./graphql/server/get-single-action.generated";
import { getAPIServiceGraphqlClient } from "@/lib/graphql";
import { ActionDangerZoneContent } from "../ActionDangerZoneContent";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type ActionIdDangerPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdDangerPage = async ({
  params,
}: ActionIdDangerPageProps) => {
  const actionID = params?.actionId;
  const client = await getAPIServiceGraphqlClient();
  const data = await GetActionSdk(client).Action({
    action_id: actionID ?? "",
  });

  const action = data?.action[0];

  return (
    <div className="w-full h-full flex flex-col items-center ">
      <div className="grid gap-y-2 w-full py-10">
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
            href="https://docs.worldcoin.org/id/incognito-actions"
            className="text-grey-700 py-3 px-7"
          >
            <DocsIcon />
            <Typography variant={TYPOGRAPHY.R3}>Learn more</Typography>
          </DecoratedButton>
        </div>
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <ActionDangerZoneContent action={action} />
      </div>
    </div>
  );
};
