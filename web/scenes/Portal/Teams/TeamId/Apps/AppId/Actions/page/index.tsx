"use client";

import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { EngineType } from "@/lib/types";
import { urls } from "@/lib/urls";
import { usePathname, useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionsList } from "./ActionsList";
import { useGetActionsQuery } from "./graphql/client/actions.generated";
import { useGetAppQuery } from "./graphql/client/app.generated";

type ActionsPageProps = {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
};

export const ActionsPage = (props: ActionsPageProps) => {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as string;
  const pathName = usePathname() ?? "";
  const router = useRouter();

  const searchForm = useForm<{ keyword: string }>({
    mode: "onChange",
  });

  const keyword = useWatch({
    control: searchForm.control,
    name: "keyword",
  });

  const appRes = useGetAppQuery({
    variables: {
      app_id: appId ?? "",
    },
    skip: !appId,
  });

  const actionsRes = useGetActionsQuery({
    variables: {
      app_id: appId ?? "",
      condition: !keyword
        ? {}
        : [
            { name: { _ilike: `%${keyword}%` } },
            { description: { _ilike: `%${keyword}%` } },
            { action: { _ilike: `%${keyword}%` } },
          ],
    },
    skip: !appId,
  });

  const engineType = appRes.data?.app?.engine;
  const hasLegacyActions = (actionsRes.data?.actions?.length ?? 0) > 0;
  const showLegacyList = searchParams.legacy === "true" && hasLegacyActions;

  useEffect(() => {
    if (appRes.loading || actionsRes.loading) {
      return;
    }

    if (showLegacyList) {
      return;
    }
    const worldIdActionsUrl = urls.worldIdActions({
      team_id: teamId,
      app_id: appId,
    });

    router.replace(
      searchParams.createAction === "true"
        ? `${worldIdActionsUrl}?createAction=true`
        : worldIdActionsUrl,
    );
  }, [
    appRes.loading,
    actionsRes.loading,
    showLegacyList,
    teamId,
    appId,
    router,
    searchParams.createAction,
  ]);

  if (!appRes.loading && !appRes.data?.app) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App Not found" />
      </SizingWrapper>
    );
  }

  if (!showLegacyList) {
    return null;
  }

  return (
    <SizingWrapper gridClassName="grow" className="flex flex-col">
      <ActionsList
        searchForm={searchForm}
        items={actionsRes}
        generateItemHref={(id) =>
          engineType === EngineType.OnChain
            ? `${pathName}/${id}/settings`
            : `${pathName}/${id}`
        }
        engineType={engineType}
        isReadOnly
      />
    </SizingWrapper>
  );
};
