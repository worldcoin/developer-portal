"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { IncognitoActionIcon } from "@/components/Icons/IncognitoActionIcon";
import { LogoLinesIcon } from "@/components/Icons/LogoLines";
import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";
import { ActionsList } from "./ActionsList/ActionsList";
import clsx from "clsx";
import { CreateActionModal } from "./CreateActionModal";
import { ListActions } from "./ActionsList/ListActions";
import {
  useActionsLazyQuery,
  useActionsQuery,
} from "../graphql/actions.generated";
import { cache } from "react";
import gql from "graphql-tag";

type ActionsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

// TODO: Ad TWK Lausanne font
export const ActionsPage = ({ params, searchParams }: ActionsPageProps) => {
  const createAction = searchParams?.createAction;
  const appId = params?.appId as `app_${string}`;
  const listActions = true; //  Temp will replace with a fetch in later component

  const { data, loading, refetch } = useActionsQuery({
    variables: { app_id: appId ?? "" },
  });

  if (loading) {
    return <div></div>;
  } else if (createAction) {
    return <CreateActionModal refetchActions={refetch} />;
  } else {
    if (data?.action && data?.action?.length > 0) {
      return <ListActions actions={data.action} />;
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
            <DecoratedButton
              variant="primary"
              href="?createAction=true"
              className="text-sm px-5 py-1 rounded-[.7rem]"
            >
              Create
            </DecoratedButton>
          </div>
        </div>
      );
    }
  }
};

// TODO: Don't think caching makes sense here since we don't know if another user has created a new action
// const getAction = cache(async (appId: string) => {
//   const actionsQuery = gql`
//     query Actions($app_id: String!) {
//       action(
//         order_by: { created_at: asc }
//         where: { app_id: { _eq: $app_id }, action: { _neq: "" } }
//       ) {
//         id
//         app_id
//         action
//         created_at
//         creation_mode
//         description
//         external_nullifier
//         kiosk_enabled
//         name
//         max_accounts_per_user
//         max_verifications
//         updated_at
//         nullifiers {
//           id
//           created_at
//           nullifier_hash
//           uses
//         }
//       }
//     }
//   `;
//   if (appId !== "") {
//     const client = getClient();
//     const { data } = await client.query({
//       query: actionsQuery,
//       variables: { app_id: appId },
//     });
//     console.log(data);
//     return data;
//   }
// });
