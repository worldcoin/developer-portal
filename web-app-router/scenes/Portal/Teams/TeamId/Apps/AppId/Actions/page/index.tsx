import { DecoratedButton } from "@/components/DecoratedButton";
import { IncognitoActionIcon } from "@/components/Icons/IncognitoActionIcon";
import { LogoLinesIcon } from "@/components/Icons/LogoLines";
import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";
import { CreateActionModal } from "./createAction";
import { ListActions } from "./ListActions";
import {
  useActionsLazyQuery,
  useActionsQuery,
} from "../graphql/actions.generated";
import { cache } from "react";

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
  const appId = params?.appId;
  console.log(appId);

  const alpha = true;
  // const action = await getAction(
  //   "app_staging_68306aab1aaf0ac802bc4cc0d3002184"
  // );
  // console.log(action);

  if (createAction) {
    return <CreateActionModal />;
  } else {
    if (alpha) {
      return (
        <div className="w-full h-full flex flex-col justify-center items-center pt-24">
          <ListActions />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex flex-col items-center pt-24">
          <div className="grid gap-y-4 place-items-center max-w-[600px]">
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
      );
    }
  }
};

export const getAction = cache(async (appId: string) => {
  const { data, loading: isActionsLoading } = useActionsQuery({
    variables: { app_id: appId ?? "" },
  });
  return data;
});
