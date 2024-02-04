"use client";

import { CreateActionModal } from "./CreateActionModal";
import { useGetActionsQuery } from "./graphql/client/actions.generated";
import { ActionsList } from "./ActionsList";
import clsx from "clsx";
import { InitialSteps, StepEnum } from "@/components/InitialSteps";
import { PlusCircleIcon } from "@/components/Icons/PlusCircleIcon";
import { TestTubeIcon } from "@/components/Icons/TestTubeIcon";
import { UserStoryIcon } from "@/components/Icons/UserStoryIcon";
import { Step } from "@/components/InitialSteps/Step";
import { IconFrame } from "@/components/InitialSteps/IconFrame";

type ActionsPageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

// TODO: Ad TWK Lausanne font
export const ActionsPage = ({ params, searchParams }: ActionsPageProps) => {
  const createAction = searchParams?.createAction;
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const { data, loading } = useGetActionsQuery({
    variables: {
      app_id: appId ?? "",
    },
    context: { headers: { team_id: teamId } },
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

      <CreateActionModal
        className={clsx({ hidden: !createAction })}
        firstAction={data.action.length === 0} // Due to the refetch query completing this value will be updated to 1
      />

      <div
        className={clsx("flex flex-col items-center pt-24", {
          hidden: showList || createAction,
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
                <IconFrame className="bg-blue-500 text-grey-0">
                  <PlusCircleIcon />
                </IconFrame>
              }
              title="Add your app"
              description="App created"
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
              title="Create incognito action"
              description="Allow user to verify as a unique person"
              buttonText="Create"
            />,
            <Step
              href="#"
              key={`actions-tutorial-step-3`}
              icon={
                <IconFrame className="bg-additional-orange-500 text-grey-0">
                  <TestTubeIcon />
                </IconFrame>
              }
              title="Test it hard!"
              description="Test your app in simulator"
              buttonText="Test"
              disabled
            />,
          ]}
        />
      </div>
    </div>
  );
};
