import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import Link from "next/link";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { getSdk as GetActionSdk } from "./graphql/server/get-single-action.generated";
import { getAPIServiceGraphqlClient } from "@/lib/graphql";
import { ActionDangerZoneContent } from "./ActionDangerZoneContent";

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
      <div className="grid gap-y-2 max-w-[1180px] w-full py-10">
        <div>
          <Link href=".." className="flex flex-row items-center gap-x-2">
            <CaretIcon className="h-3 w-3 text-grey-400 rotate-90" />
            <p className="text-grey-700 font-[400] text-xs">
              Back to Incognito Actions
            </p>
          </Link>
        </div>
        <div className="w-full flex justify-between items-center">
          <h1 className="text-grey-900 text-2xl font-[550] capitalize">
            {action.name}
          </h1>
          <DecoratedButton
            variant="secondary"
            href="https://docs.worldcoin.org/id/incognito-actions"
            className="text-grey-700 py-3 px-7 "
          >
            <DocsIcon />
            Learn more
          </DecoratedButton>
        </div>
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <ActionDangerZoneContent action={action} />
      </div>
    </div>
  );
};
