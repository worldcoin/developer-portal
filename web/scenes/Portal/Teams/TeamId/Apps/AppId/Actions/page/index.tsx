"use client";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { EngineType } from "@/lib/types";
import { usePathname } from "next/navigation";
import { use } from "react";
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
  const appId = params?.appId as `app_${string}`;
  const pathName = usePathname() ?? "";

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

  if (!appRes.loading && !appRes.data?.app) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App Not found" />
      </SizingWrapper>
    );
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
