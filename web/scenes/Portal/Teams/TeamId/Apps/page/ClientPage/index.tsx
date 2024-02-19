"use client";

import { PlusCircleIcon } from "@/components/Icons/PlusCircleIcon";
import { UserStoryIcon } from "@/components/Icons/UserStoryIcon";
import { InitialSteps } from "@/components/InitialSteps";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { Step } from "@/components/InitialSteps/Step";
import { SizingWrapper } from "@/components/SizingWrapper";
import { createAppDialogOpenedAtom } from "@/scenes/Portal/layout/Header";
import { useAtom } from "jotai";
import { Fragment } from "react";

export const ClientPage = () => {
  const [_, setCreateAppDialogOpen] = useAtom(createAppDialogOpenedAtom);

  return (
    <Fragment>
      <SizingWrapper gridClassName="h-full flex justify-center items-center pb-10">
        <InitialSteps
          title="Build your first project"
          description="Welcome to World ID! Let's get started by creating your first app."
          steps={[
            <Step
              key={`apps-tutorial-step-1`}
              type="button"
              onClick={() => setCreateAppDialogOpen(true)}
              icon={
                <IconFrame className="bg-blue-500 text-grey-0">
                  <PlusCircleIcon />
                </IconFrame>
              }
              title="Create an app"
              description="Begin by creating your app"
              buttonText="Start"
            />,

            <Step
              key={`apps-tutorial-step-2`}
              href="?createAction=true"
              icon={
                <IconFrame className="bg-grey-100 text-grey-500">
                  <UserStoryIcon />
                </IconFrame>
              }
              title="Create an incognito action"
              description="Allow user to verify as a unique human"
              buttonText="Create"
              disabled
            />,
          ]}
        />
      </SizingWrapper>
    </Fragment>
  );
};
