"use client";

import clsx from "clsx";
import { ReactNode } from "react";
import { LogoLinesIcon } from "../Icons/LogoLines";
import { WorldBlueprintIcon } from "../Icons/WorldBlueprintIcon";
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
      className={clsx(
        "grid w-full max-w-[480px] items-center justify-items-center gap-y-6 ",
      )}
    >
      <div className="relative min-h-[60px] max-w-full">
        <LogoLinesIcon className="z-0 w-full" />
        <WorldBlueprintIcon className="absolute inset-0 m-auto size-[60px] rounded-2xl" />
      </div>

      <div className="grid w-full max-w-[320px] grid-cols-1 gap-y-2 text-center md:max-w-full">
        <Typography variant={TYPOGRAPHY.H6}>{props.title}</Typography>

        <Typography
          variant={TYPOGRAPHY.R4}
          className="px-2 text-center text-sm text-grey-500"
        >
          {props.description}
        </Typography>
      </div>

      <div
        className={clsx(
          "mt-4 max-w-[320px] rounded-2xl border border-grey-200 shadow-button md:max-w-full",
        )}
      >
        {props.steps.map((step) => step)}
      </div>
    </div>
  );
};
