import { DecoratedButton } from "@/components/DecoratedButton";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { getSdk as GetActionSdk } from "./graphql/server/get-single-action.generated";
import { UpdateActionForm } from "../UpdateAction";
import { TryAction } from "../TryAction";
import { getAPIServiceGraphqlClient } from "@/lib/graphql";
import { Link } from "@/components/Link";

type ActionIdSettingsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionIdSettingsPage = async ({
  params,
}: ActionIdSettingsPageProps) => {
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
          <Link
            href={`..?$action_name=${action.name}`}
            className="flex flex-row items-center gap-x-2"
          >
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
            href="https://docs.worldcoin.org/id/idkit"
            className="text-grey-700 py-3 px-7 "
          >
            <DocsIcon />
            Learn more
          </DecoratedButton>
        </div>
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <div className="w-full grid-cols-2 grid items-start justify-between gap-x-32">
          <UpdateActionForm action={action} />
          <TryAction action={action} />
        </div>
      </div>
    </div>
  );
};
