"use client";
import { ErrorPage } from "@/components/ErrorPage";
import { UserStoryIcon } from "@/components/Icons/UserStoryIcon";
import { InitialSteps } from "@/components/InitialSteps";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { Step } from "@/components/InitialSteps/Step";
import { Placeholder } from "@/components/PlaceholderImage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { EngineType } from "@/lib/types";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ActionsList } from "./ActionsList";
import { CreateActionModal } from "./CreateActionModal";
import { useGetActionsQuery } from "./graphql/client/actions.generated";
import { useGetAppQuery } from "./graphql/client/app.generated";

type ActionsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionsPage = ({ params, searchParams }: ActionsPageProps) => {
  const createAction = searchParams?.createAction;
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

  const { data } = actionsRes;

  const engineType = appRes.data?.app?.engine;
  const appName = appRes.data?.app?.app_metadata[0]?.name;
  const hasRpRegistration =
    (appRes.data?.app?.rp_registration?.length ?? 0) > 0;

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
          isReadOnly={hasRpRegistration}
        />
      )}

      {isInitial && (
        <div className="grid size-full items-start justify-items-center overflow-hidden pt-20">
          <InitialSteps
            title="Create your first action"
            description="Actions are used to request uniqueness proofs"
            steps={[
              // FIXME: pass actual app
              <Step
                key={`actions-tutorial-step-1`}
                href="#"
                icon={
                  <IconFrame className="">
                    <Placeholder
                      name={appName ?? "Add your app"}
                      className="size-full rounded-full"
                    />
                  </IconFrame>
                }
                title={appName ?? "Add your app"}
                description="App created successfully"
                buttonText="Start"
                testId="app-1"
                completed
              />,
              <Step
                key={`actions-tutorial-step-2`}
                href="?createAction=true"
                icon={
                  <IconFrame className="bg-additional-purple-500 text-grey-0">
                    <UserStoryIcon />
                  </IconFrame>
                }
                title="Create action"
                description="Allow user to verify as a unique person"
                buttonText="Create"
                testId="create-action"
              />,
            ]}
          />
        </div>
      )}

      {createAction && !hasRpRegistration && (
        <CreateActionModal
          className={clsx({ hidden: !createAction })}
          engineType={engineType}
          firstAction={data?.actions.length === 0} // Due to the refetch query completing this value will be updated to 1
        />
      )}
    </SizingWrapper>
  );
};
