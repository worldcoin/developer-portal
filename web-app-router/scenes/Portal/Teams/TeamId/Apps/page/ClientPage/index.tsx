"use client";

import { PlusCircleIcon } from "@/components/Icons/PlusCircleIcon";
import { TestTubeIcon } from "@/components/Icons/TestTubeIcon";
import { UserStoryIcon } from "@/components/Icons/UserStoryIcon";
import { InitialSteps } from "@/components/InitialSteps";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { Step } from "@/components/InitialSteps/Step";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Fragment, Suspense, useState } from "react";
import { CreateAppDialog } from "../CreateAppDialog";

export const ClientPage = () => {
  const [dialogOpened, setDialogOpened] = useState(false);

  return (
    <Fragment>
      <SizingWrapper gridClassName="h-full flex justify-center items-center">
        <InitialSteps
          title="Build your first project"
          description="Simple guide will help you"
          steps={[
            <Step
              key={`apps-tutorial-step-1`}
              type="button"
              onClick={() => setDialogOpened(true)}
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

      <CreateAppDialog open={dialogOpened} onClose={setDialogOpened} />
    </Fragment>
  );
};
