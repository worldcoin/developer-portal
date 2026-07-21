"use client";

import { Button } from "@/components/Button";
import { urls } from "@/lib/urls";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import dynamic from "next/dynamic";
import { ReactNode, useState } from "react";

const CreateAppDialogV4 = dynamic(() =>
  import("@/scenes/PortalV3/layout/CreateAppDialog/index-v4").then(
    (module) => module.CreateAppDialogV4,
  ),
);

const actionButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-8 bg-portal-ink px-4 font-world text-13 font-medium leading-none text-white transition-colors hover:bg-portal-ink-hover focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2";

const ActionCard = (props: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}) => (
  <section className="relative flex min-h-[244px] flex-col rounded-[10px] border border-portal-border bg-white p-6 shadow-portal-card">
    {props.badge ? (
      <div className="absolute top-6 right-6 rounded-full bg-portal-purple/10 px-2 py-1 font-world text-12 leading-none font-medium text-portal-purple">
        {props.badge}
      </div>
    ) : null}

    <div
      className={`flex size-12 items-center justify-center rounded-full text-white ${props.iconClassName}`}
    >
      {props.icon}
    </div>

    <div className="mt-6 max-w-[420px]">
      <h2 className="font-world text-20 leading-[1.2] font-medium text-portal-text">
        {props.title}
      </h2>
      <p className="mt-2 font-world text-15 leading-[1.45] text-portal-muted">
        {props.description}
      </p>
    </div>

    <div className="mt-auto pt-6">{props.children}</div>
  </section>
);

export const AppsPageClient = (props: { teamId: string }) => {
  const [createAppOpen, setCreateAppOpen] = useState(false);
  // Latched on first open: keeps the dialog mounted so `open` drives its
  // enter/leave animations, while still deferring the chunk until first use.
  const [dialogMounted, setDialogMounted] = useState(false);

  return (
    <>
      {dialogMounted ? (
        <CreateAppDialogV4 open={createAppOpen} onClose={setCreateAppOpen} />
      ) : null}

      <div className="px-6 py-10 lg:px-10">
        <div>
          <h1 className="font-world text-26 leading-[1.2] font-medium text-portal-heading">
            Welcome to World ID
          </h1>
          <p className="mt-1 font-world text-15 leading-[1.45] text-portal-muted">
            Let&apos;s create your first app.
          </p>
        </div>

        <div className="mt-10 grid max-w-[1176px] gap-[22px] xl:grid-cols-2">
          <ActionCard
            icon={<Icon name="card-toolkit" className="size-7" />}
            iconClassName="bg-portal-blue"
            title="Create an app"
            description="Configure your app and actions through the developer portal interface."
          >
            <Button
              type="button"
              onClick={() => {
                setDialogMounted(true);
                setCreateAppOpen(true);
              }}
              className={actionButtonClassName}
              data-testid="button-create-new-app"
            >
              Create new app
            </Button>
          </ActionCard>

          <ActionCard
            icon={<Icon name="card-wand" className="size-7" />}
            iconClassName="bg-portal-purple"
            title="Set up MCP via API key"
            description="Connect Codex, Claude, or any MCP client to build and manage your app via natural language."
            badge="New"
          >
            <Button
              href={urls.teamSettings({ team_id: props.teamId })}
              className={actionButtonClassName}
            >
              Create API key
            </Button>
          </ActionCard>
        </div>
      </div>
    </>
  );
};
