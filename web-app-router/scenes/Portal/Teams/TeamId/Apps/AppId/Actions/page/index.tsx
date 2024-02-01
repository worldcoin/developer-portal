"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { LogoLinesIcon } from "@/components/Icons/LogoLines";
import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";
import { CreateActionModal } from "./CreateActionModal";
import { useGetActionsQuery } from "./graphql/client/actions.generated";
import { ActionsList } from "./ActionsList";
import clsx from "clsx";
import { IncognitoActionIcon } from "@/components/Icons/IncognitoActionIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type ActionsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

// TODO: Ad TWK Lausanne font
export const ActionsPage = ({ params, searchParams }: ActionsPageProps) => {
  const createAction = searchParams?.createAction;
  const appId = params?.appId as `app_${string}`;

  const { data, loading } = useGetActionsQuery({
    variables: {
      app_id: appId ?? "",
    },
  });

  const showList = data?.action && data?.action?.length > 0;

  if (loading) return <></>;
  if (!data) return <>No App Found</>;
  return (
    <div className={clsx("w-full h-full")}>
      <ActionsList
        actions={data.action}
        className={clsx({ hidden: !showList || createAction })}
      />
      <CreateActionModal className={clsx({ hidden: !createAction })} />
      <div
        className={clsx("flex flex-col items-center pt-24", {
          hidden: showList || createAction,
        })}
      >
        <div className={clsx("grid gap-y-4 place-items-center max-w-[600px]")}>
          <div className="relative">
            <LogoLinesIcon className="z-0" />
            <WorldcoinBlueprintIcon className="absolute inset-0 m-auto z-10 w-[60px] h-[60px] rounded-2xl" />
          </div>
          <div className="grid place-items-center gap-y-2 grid-cols-1">
            <Typography variant={TYPOGRAPHY.H6}>
              Create your first incognito action
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R4}
              className="text-grey-500 text-sm"
            >
              Allow users to verify as a unique person without revealing their
              identity
            </Typography>
          </div>
          <div className="grid grid-cols-auto/1fr/auto gap-x-4 w-full mt-5 border-grey-200 border p-5 rounded-2xl shadow-button">
            <IncognitoActionIcon />
            <div className="grid grid-cols-1">
              <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
                Create an incognito action
              </Typography>
              <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
                Verify users as unique humans
              </Typography>
            </div>
            <DecoratedButton
              variant="primary"
              href="?createAction=true"
              className="px-5 py-1 rounded-[.7rem]"
            >
              <Typography variant={TYPOGRAPHY.R4}>Create</Typography>
            </DecoratedButton>
          </div>
        </div>
      </div>
    </div>
  );
};
