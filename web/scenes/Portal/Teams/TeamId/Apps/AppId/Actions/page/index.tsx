"use client";

import { UserStoryIcon } from "@/components/Icons/UserStoryIcon";
import { InitialSteps } from "@/components/InitialSteps";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { Step } from "@/components/InitialSteps/Step";
import { Placeholder } from "@/components/PlaceholderImage";
import { SizingWrapper } from "@/components/SizingWrapper";
import clsx from "clsx";
import ErrorComponent from "next/error";
import { useEffect, useState } from "react";
import { ActionsList } from "./ActionsList";
import { CreateActionModal } from "./CreateActionModal";
import { useGetActionsQuery } from "./graphql/client/actions.generated";

type ActionsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const ActionsPage = ({ params, searchParams }: ActionsPageProps) => {
  const createAction = searchParams?.createAction;
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [showList, setShowList] = useState(false);

  const { data, loading } = useGetActionsQuery({
    variables: {
      app_id: appId ?? "",
    },
    context: { headers: { team_id: teamId } },
  });

  useEffect(() => {
    setShowList((data?.action && data?.action?.length > 0) ?? false);
  }, [data?.action]);

  const engineType = data?.app[0]?.engine;
  const appName = data?.app[0]?.app_metadata[0]?.name;

  if (!loading && !data) {
    return (
      <ErrorComponent
        statusCode={404}
        title="Actions not found"
      ></ErrorComponent>
    );
  } else {
    return (
      <SizingWrapper>
        {!loading && (
          <ActionsList
            actions={data?.action!}
            engineType={engineType}
            className={clsx({ hidden: !showList || createAction })}
          />
        )}
        {loading ? (
          <div
            className={clsx(
              "fixed inset-0 grid w-full items-center justify-center bg-white",
              {
                hidden: !createAction,
              },
            )}
          ></div>
        ) : (
          <CreateActionModal
            className={clsx({ hidden: !createAction })}
            engineType={engineType}
            firstAction={data?.action.length === 0} // Due to the refetch query completing this value will be updated to 1
          />
        )}

        <div
          className={clsx("flex flex-col items-center pt-24", {
            hidden: showList || createAction || loading,
          })}
        >
          <InitialSteps
            title="Create your first incognito action"
            description="Allow users to verify as a unique person without revealing their
          identity"
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
                title="Create an incognito action"
                description="Allow user to verify as a unique person"
                buttonText="Create"
              />,
            ]}
          />
        </div>
      </SizingWrapper>
    );
  }
};
