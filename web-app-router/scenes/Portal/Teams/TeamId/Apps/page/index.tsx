import { SizingWrapper } from "@/components/SizingWrapper";
import { Auth0SessionUser } from "@/lib/types";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { getSdk as getInitialAppSdk } from "./graphql/server/apps.generated";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { PlusCircleIcon } from "@/components/Icons/PlusCircleIcon";
import { TestTubeIcon } from "@/components/Icons/TestTubeIcon";
import { UserStoryIcon } from "@/components/Icons/UserStoryIcon";
import { InitialSteps } from "@/components/InitialSteps";
import { Step } from "@/components/InitialSteps/Step";
import { IconFrame } from "@/components/InitialSteps/IconFrame";

export const AppsPage = async () => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;

  if (!user) {
    return redirect("/api/auth/logout");
  }

  const teamId = user.hasura.memberships[0].team?.id;

  if (!teamId) {
    return redirect("/api/auth/logout");
  }
  const client = await getAPIServiceGraphqlClient();

  const { app } = await getInitialAppSdk(client).InitialApp({
    teamId,
  });

  if (app.length > 0) {
    return redirect(`/teams/${teamId}/apps/${app[0].id}`);
  }

  return (
    <SizingWrapper gridClassName="h-full flex justify-center items-center">
      <InitialSteps
        title="Build your first project"
        description="Simple guide will help you"
        steps={[
          // FIXME: pass actual app
          <Step
            key={`apps-tutorial-step-1`}
            href="#"
            icon={
              <IconFrame className="bg-blue-500 text-grey-0">
                <PlusCircleIcon />
              </IconFrame>
            }
            title="Add your app"
            description="Begin by listing your app"
            buttonText="Start"
          />,

          <Step
            key={`apps-tutorial-step-2`}
            href="?createAction=true"
            icon={
              <IconFrame className="bg-additional-purple-500 text-grey-0">
                <UserStoryIcon />
              </IconFrame>
            }
            title="Create incognito action"
            description="Allow user to verify as a unique person"
            buttonText="Create"
            disabled
          />,

          <Step
            href="#"
            key={`apps-tutorial-step-3`}
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
    </SizingWrapper>
  );
};
