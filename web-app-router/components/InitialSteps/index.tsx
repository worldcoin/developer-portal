"use client";

import clsx from "clsx";
import { LogoLinesIcon } from "../Icons/LogoLines";
import { WorldcoinBlueprintIcon } from "../Icons/WorldcoinBlueprintIcon";
import { Typography, TYPOGRAPHY } from "../Typography";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { PlusCircleIcon } from "../Icons/PlusCircleIcon";
import { TestTubeIcon } from "../Icons/TestTubeIcon";
import { UserStoryIcon } from "../Icons/UserStoryIcon";
import { IconFrame } from "./IconFrame";
import { Step } from "./Step";
import { ReactNode, useState } from "react";
import { Button } from "../Button";

export enum StepEnum {
  CreateApp,
  CreateAction,
  TestIt,
}

export const InitialSteps = (props: {
  title: string;
  description: string;
  steps: ReactNode[];
}) => {
  const { user } = useUser() as Auth0SessionUser;
  const [currentStep, setCurrentStep] = useState<StepEnum>(
    StepEnum.CreateAction,
  );

  return (
    <div
      className={clsx("grid gap-y-4 place-items-center w-full max-w-[480px]")}
    >
      <div className="relative">
        <LogoLinesIcon className="z-0" />

        <WorldcoinBlueprintIcon className="absolute inset-0 m-auto z-10 w-[60px] h-[60px] rounded-2xl" />
      </div>

      <div className="grid place-items-center gap-y-2 grid-cols-1">
        <Typography variant={TYPOGRAPHY.H6}>{props.title}</Typography>

        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500 text-sm">
          {props.description}
        </Typography>
      </div>

      <div className={clsx("border-grey-200 border rounded-2xl shadow-button")}>
        {props.steps.map((step) => step)}
      </div>

      {/* REVIEW: What exactly should happend on skip tutorial? */}
      {/* FIXME: Update href/onClick */}
      <Button href="/profile">
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
          Skip tutorial
        </Typography>
      </Button>
    </div>
  );
};
