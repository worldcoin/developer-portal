import { DecoratedButton } from "@/components/DecoratedButton";
import { LogoLinesIcon } from "@/components/Icons/LogoLines";
import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";
import { CreateActionModal } from "./CreateActionModal";
import { getSdk as GetActionsSdk } from "./graphql/server/actions.generated";
import { ActionsList } from "./ActionsList";
import clsx from "clsx";
import { IncognitoActionIcon } from "@/components/Icons/IncognitoActionIcon";
import { getAPIServiceGraphqlClient } from "@/lib/graphql";

type ActionsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

// TODO: Ad TWK Lausanne font
export const ActionsPage = async ({
  params,
  searchParams,
}: ActionsPageProps) => {
  const createAction = searchParams?.createAction;
  const appId = params?.appId as `app_${string}`;
  const client = await getAPIServiceGraphqlClient();

  const data = await GetActionsSdk(client).Actions({
    app_id: appId,
  });

  const showList = data?.action && data?.action?.length > 0;
  return (
    <div className="w-full h-full">
      <ActionsList
        actions={data.action}
        className={clsx({ hidden: !showList && !createAction })}
      />
      <CreateActionModal className={clsx({ hidden: !createAction })} />
      <div
        className={clsx("flex flex-col items-center pt-24", {
          hidden: !createAction && showList,
        })}
      >
        <div
          className={clsx("grid gap-y-4 place-items-center max-w-[600px]", {
            hidden: !createAction && !showList,
          })}
        >
          <div className="relative">
            <LogoLinesIcon className="z-0" />
            <WorldcoinBlueprintIcon className="absolute inset-0 m-auto z-10 w-[60px] h-[60px] rounded-2xl" />
          </div>
          <div className="grid place-items-center gap-y-2 grid-cols-1">
            <h1 className="text-2xl font-[550]">
              Create your first incognito action
            </h1>
            <p className="text-grey-500 font-[400] text-sm">
              Allow users to verify as a unique person without revealing their
              identity
            </p>
          </div>
          <div className="grid grid-cols-auto/1fr/auto gap-x-4 w-full mt-5 border-grey-200 border p-5 rounded-2xl shadow-button">
            <IncognitoActionIcon />
            <div className="grid grid-cols-1">
              <p className="text-grey-900 text-base font-[500]">
                Create an incognito action
              </p>
              <p className="text-xs text-grey-500 font-[400]">
                Verify users as unique humans
              </p>
            </div>
            <DecoratedButton
              variant="primary"
              href="?createAction=true"
              className="text-sm px-5 py-1 rounded-[.7rem]"
            >
              Create
            </DecoratedButton>
          </div>
        </div>
      </div>
    </div>
  );
};
