"use client";

import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { FetchAppsDocument } from "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated";
import { useCreateAppDialog } from "@/scenes/common/layout/CreateAppDialog/useCreateAppDialog";
import { useLazyQuery } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { ReactNode, useEffect, useRef, useState } from "react";

const CreateKeyModal = dynamic(
  () =>
    import(
      "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/CreateKeyModal"
    ).then((module) => module.CreateKeyModal),
  { loading: () => null },
);

// Collapses Chrome's visibilitychange+focus double-fire on a tab return.
const RETURN_CHECK_MIN_INTERVAL_MS = 1_000;

const ActionCard = (props: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}) => (
  <section className="relative flex min-h-[244px] flex-col rounded-[10px] border border-portal-border bg-grey-0 p-6 shadow-portal-card">
    {props.badge ? (
      // Neutral hairline chip with the purple dot carrying the accent — no
      // tinted container, per the portal status/tag grammar.
      <div className="absolute top-6 right-6 flex items-center gap-x-1.5 rounded-full border border-grey-200 bg-grey-0 px-2 py-1 font-world text-12 leading-none font-medium text-portal-text">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-portal-purple"
        />
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

export const AppsPageClient = (props: {
  teamId: string;
  initialIsOwner?: boolean;
}) => {
  const { open: openCreateAppDialog } = useCreateAppDialog();
  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [keyDialogMounted, setKeyDialogMounted] = useState(false);
  const { user } = useUser() as Auth0SessionUser;

  // useUser resolves client-side; fall back to the server's answer until it does.
  const isOwner = user
    ? checkUserPermissions(user, props.teamId, [Role_Enum.Owner])
    : Boolean(props.initialIsOwner);

  // The cache holds this page's zero-app answer; only the network can see one
  // created out-of-band (MCP) while the user was in their terminal.
  const [fetchApps] = useLazyQuery(FetchAppsDocument, {
    fetchPolicy: "network-only",
  });
  const lastCheckAt = useRef(0);
  const keyDialogWasOpen = useRef(false);

  useEffect(() => {
    // A navigation must never yank the one-shot key secret off screen.
    if (createKeyOpen) {
      keyDialogWasOpen.current = true;
      return;
    }

    const checkForApp = async () => {
      if (Date.now() - lastCheckAt.current < RETURN_CHECK_MIN_INTERVAL_MS) {
        return;
      }
      lastCheckAt.current = Date.now();

      const result = await fetchApps({
        variables: { teamId: props.teamId },
      }).catch(() => null);
      const appId = result?.data?.app?.[0]?.id;
      if (!appId) return;

      // Hard nav on purpose, matching app creation: re-renders the
      // session-rendered shell and keeps routing server-owned.
      window.location.replace(`/teams/${props.teamId}/apps/${appId}`);
    };

    // Likeliest MCP path: the app was created while the secret was on screen,
    // so the dialog closing is the only signal left.
    if (keyDialogWasOpen.current) {
      keyDialogWasOpen.current = false;
      void checkForApp();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      void checkForApp();
    };
    const handleFocus = () => void checkForApp();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [createKeyOpen, fetchApps, props.teamId]);

  return (
    <>
      {keyDialogMounted ? (
        <CreateKeyModal
          teamId={props.teamId}
          isOpen={createKeyOpen}
          setIsOpen={setCreateKeyOpen}
        />
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

        <div
          className={clsx(
            "mt-10 grid max-w-[1176px] gap-[22px]",
            isOwner && "xl:grid-cols-2",
          )}
        >
          <ActionCard
            icon={<Icon name="card-toolkit" className="size-7" />}
            iconClassName="bg-portal-blue"
            title="Create an app"
            description="Configure your app and actions through the developer portal interface."
          >
            <InkButton
              type="button"
              onClick={openCreateAppDialog}
              data-testid="button-create-new-app"
            >
              Create new app
            </InkButton>
          </ActionCard>

          {isOwner ? (
            <ActionCard
              icon={<Icon name="card-wand" className="size-7" />}
              iconClassName="bg-portal-purple"
              title="Set up MCP via API key"
              description="Connect Codex, Claude, or any MCP client to build and manage your app via natural language."
              badge="New"
            >
              <InkButton
                type="button"
                onClick={() => {
                  setKeyDialogMounted(true);
                  setCreateKeyOpen(true);
                }}
              >
                Create API key
              </InkButton>
            </ActionCard>
          ) : null}
        </div>
      </div>
    </>
  );
};
