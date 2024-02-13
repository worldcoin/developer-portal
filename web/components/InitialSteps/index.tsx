"use client";

import clsx from "clsx";
import { ReactNode } from "react";
import { Button } from "../Button";
import { LogoLinesIcon } from "../Icons/LogoLines";
import { WorldcoinBlueprintIcon } from "../Icons/WorldcoinBlueprintIcon";
import { Typography, TYPOGRAPHY } from "../Typography";

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
  return (
    <div
      className={clsx("grid w-full max-w-[480px] place-items-center gap-y-6")}
    >
      <div className="relative">
        <LogoLinesIcon className="z-0" />

        <WorldcoinBlueprintIcon className="absolute inset-0 z-10 m-auto size-[60px] rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 place-items-center gap-y-2">
        <Typography variant={TYPOGRAPHY.H6}>{props.title}</Typography>

        <Typography variant={TYPOGRAPHY.R4} className="text-sm text-grey-500">
          {props.description}
        </Typography>
      </div>

      <div
        className={clsx(
          "mt-4 rounded-2xl border border-grey-200 shadow-button",
        )}
      >
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
