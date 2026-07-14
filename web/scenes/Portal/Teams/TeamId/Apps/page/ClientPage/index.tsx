"use client";

import { Button } from "@/components/Button";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { CodeIcon } from "@/components/Icons/CodeIcon";
import { LockIcon } from "@/components/Icons/LockIcon";
import { InitialSteps } from "@/components/InitialSteps";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { createAppDialogOpenedAtom } from "@/scenes/common/layout/Header/atoms";
import { useAtom } from "jotai";
import { Fragment } from "react";

const pathButtonClassName =
  "flex h-10 w-full items-center justify-center gap-2 rounded-12 border px-4 font-gta text-sm font-medium leading-none shadow-button transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-150 md:h-11";

const PathStep = (props: {
  index: number;
  title: string;
  description: string;
  disabled?: boolean;
  variant: "manual" | "agents";
}) => {
  const isAgents = props.variant === "agents";

  return (
    <div
      className={
        props.disabled
          ? "flex min-h-14 items-center gap-3 rounded-12 bg-grey-50 p-3 opacity-60"
          : isAgents
            ? "flex min-h-14 items-center gap-3 rounded-12 border border-blue-150/50 bg-grey-0 p-3 shadow-button"
            : "flex min-h-14 items-center gap-3 rounded-12 bg-grey-50 p-3"
      }
    >
      <div
        className={
          props.disabled
            ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-grey-200 text-xs font-medium text-grey-500"
            : isAgents
              ? "flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-grey-0"
              : "flex size-6 shrink-0 items-center justify-center rounded-full bg-grey-900 text-xs font-medium text-grey-0"
        }
      >
        {props.index}
      </div>

      <div className="grid min-w-0 gap-0.5">
        <Typography variant={TYPOGRAPHY.M4} className="truncate text-grey-900">
          {props.title}
        </Typography>

        <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
          {props.description}
        </Typography>
      </div>
    </div>
  );
};

export const ClientPage = (props: { teamId: string }) => {
  const [_, setCreateAppDialogOpen] = useAtom(createAppDialogOpenedAtom);

  return (
    <Fragment>
      <SizingWrapper
        className="px-4 sm:px-6 md:px-0"
        gridClassName="grow flex justify-center items-center pb-10"
      >
        <InitialSteps
          className="max-w-[720px]"
          title="Build your first project"
          description="Welcome to World ID! Let's get started by creating your first app."
        >
          <div className="mt-2 grid w-full items-stretch gap-4 md:mt-4 md:grid-cols-2">
            <section className="grid h-full grid-rows-[auto_auto_1fr_auto] gap-4 rounded-2xl border border-grey-200 bg-grey-0 p-5 shadow-lg md:gap-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-8 bg-blue-50 text-blue-500">
                  <LockIcon className="size-4" />
                </div>

                <Typography
                  variant={TYPOGRAPHY.M5}
                  className="tracking-[0.04em] text-grey-500 uppercase"
                >
                  Build manually
                </Typography>
              </div>

              <div className="grid gap-1">
                <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
                  Build in the dashboard
                </Typography>

                <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                  Configure your app and actions through the developer portal
                  interface.
                </Typography>
              </div>

              <div className="grid content-start gap-2">
                <PathStep
                  variant="manual"
                  index={1}
                  title="Create an app"
                  description="Begin by creating your app"
                />
                <PathStep
                  variant="manual"
                  index={2}
                  title="Create action"
                  description="Verify users as unique humans"
                  disabled
                />
              </div>

              <Button
                type="button"
                onClick={() => setCreateAppDialogOpen(true)}
                className={`${pathButtonClassName} border-grey-900 bg-grey-900 bg-linear-to-b from-white/15 to-transparent text-grey-0 hover:bg-grey-700 hover:from-white/20`}
                data-testid="button-create-an-app"
              >
                Start
              </Button>
            </section>

            <section className="relative grid h-full grid-rows-[auto_auto_1fr_auto] gap-4 rounded-2xl border border-blue-150 bg-linear-to-b from-blue-50 to-additional-purple-100 p-5 shadow-lg md:gap-5 md:p-6">
              <div className="absolute top-4 right-4 rounded-full border border-blue-150 bg-grey-0 px-2 py-1 text-[10px] font-medium tracking-[0.02em] text-blue-500">
                NEW
              </div>

              <div className="flex items-center gap-3 pr-12">
                <div className="flex size-8 items-center justify-center rounded-8 bg-grey-0 text-blue-500 shadow-button">
                  <CodeIcon className="size-4" />
                </div>

                <Typography
                  variant={TYPOGRAPHY.M5}
                  className="tracking-[0.04em] text-blue-500 uppercase"
                >
                  Build with agents
                </Typography>
              </div>

              <div className="grid gap-1">
                <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
                  Set up MCP
                </Typography>

                <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                  Connect Codex, Claude, or any MCP client to build and manage
                  your app via natural language.
                </Typography>
              </div>

              <div className="grid content-start gap-2">
                <PathStep
                  variant="agents"
                  index={1}
                  title="Generate an API key"
                  description="Create credentials for MCP access"
                />
                <PathStep
                  variant="agents"
                  index={2}
                  title="Connect your agent"
                  description="Paste setup into your MCP client"
                />
              </div>

              <Button
                href={`/teams/${props.teamId}/api-keys`}
                className={`${pathButtonClassName} border-blue-500 bg-blue-500 text-grey-0 hover:border-blue-500 hover:bg-[#3f37c9]`}
              >
                Create API key
                <ArrowRightIcon className="size-4" />
              </Button>
            </section>
          </div>

          <Typography
            variant={TYPOGRAPHY.R5}
            className="max-w-[720px] text-center text-grey-400"
          >
            Both paths use the same World ID. You can switch between them
            anytime.
          </Typography>
        </InitialSteps>
      </SizingWrapper>
    </Fragment>
  );
};
