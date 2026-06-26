"use client";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { EngineType } from "@/lib/types";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { usePathname } from "next/navigation";
import { useMemo, use } from "react";
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

  const isInitial = useMemo(() => {
    if (actionsRes.loading) {
      return false;
    }
    if (keyword) {
      return false;
    }
    if (!!actionsRes.data?.actions?.length) {
      return false;
    }
    return true;
  }, [keyword, actionsRes]);

  if (!appRes.loading && !appRes.data?.app) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App Not found" />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="grow" className="flex flex-col">
      {!isInitial && (
        <ActionsList
          searchForm={searchForm}
          items={actionsRes}
          generateItemHref={(id) =>
            engineType === EngineType.OnChain
              ? `${pathName}/${id}/settings`
              : `${pathName}/${id}`
          }
          engineType={engineType}
          isReadOnly={true}
        />
      )}

      {isInitial && (
        <div className="pt-20">
          <Notification variant="warning">
            <Typography
              variant={TYPOGRAPHY.S3}
              className="text-system-warning-800"
            >
              Legacy actions are deprecated and read-only.
            </Typography>
          </Notification>
        </div>
      )}
    </SizingWrapper>
  );
};
