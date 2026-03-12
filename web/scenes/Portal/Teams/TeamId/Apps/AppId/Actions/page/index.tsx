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
import { worldId40Atom, isWorldId40Enabled } from "@/lib/feature-flags";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { appendVersionParam, resolveAppVersionParam } from "../../versioning";
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
  const teamId = params?.teamId as string;
  const requestedVersion =
    typeof searchParams?.version === "string" ? searchParams.version : null;
  const actionsBasePath = `/teams/${teamId}/apps/${appId}/actions`;

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
  const hasDraftVersion = (appRes.data?.app?.app_metadata.length ?? 0) > 0;
  const hasVerifiedVersion =
    (appRes.data?.app?.verified_app_metadata.length ?? 0) > 0;
  const selectedVersion = resolveAppVersionParam({
    requestedVersion,
    hasDraft: hasDraftVersion,
    hasVerified: hasVerifiedVersion,
  });
  const createActionHref = appendVersionParam({
    path: `${actionsBasePath}?createAction=true`,
    version: selectedVersion,
    hasDraft: hasDraftVersion,
    hasVerified: hasVerifiedVersion,
  });
  const appName =
    selectedVersion === "approved"
      ? appRes.data?.app?.verified_app_metadata[0]?.name
      : appRes.data?.app?.app_metadata[0]?.name;
  const worldId40Config = useAtomValue(worldId40Atom);
  const isEnabled = isWorldId40Enabled(worldId40Config, teamId);

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
            appendVersionParam({
              path:
                engineType === EngineType.OnChain
                  ? `${actionsBasePath}/${id}/settings`
                  : `${actionsBasePath}/${id}`,
              version: selectedVersion,
              hasDraft: hasDraftVersion,
              hasVerified: hasVerifiedVersion,
            })
          }
          engineType={engineType}
          isReadOnly={isEnabled}
          createActionHref={createActionHref}
        />
      )}

      {isInitial && (
        <>
          {isEnabled ? (
            <div className="pt-20">
              {/* Defensive fallback when client flags briefly diverge from server-side route redirects. */}
              <Notification variant="warning">
                <Typography
                  variant={TYPOGRAPHY.S3}
                  className="text-system-warning-800"
                >
                  Legacy actions are deprecated and read-only.
                </Typography>
              </Notification>
            </div>
          ) : (
            <div className="grid size-full items-start justify-items-center overflow-hidden pt-20">
              <InitialSteps
                title="Create your first action"
                description="Actions are used to request uniqueness proofs"
                steps={[
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
                    href={createActionHref}
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
        </>
      )}

      {createAction && !isEnabled && (
        <CreateActionModal
          className={clsx({ hidden: !createAction })}
          engineType={engineType}
          firstAction={data?.actions.length === 0}
        />
      )}
    </SizingWrapper>
  );
};
