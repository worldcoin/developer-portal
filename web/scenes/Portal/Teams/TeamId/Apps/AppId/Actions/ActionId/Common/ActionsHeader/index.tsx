"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import Link from "next/link";
import posthog from "posthog-js";
import { memo, useCallback } from "react";
import Skeleton from "react-loading-skeleton";
import { useGetActionNameQuery } from "./graphql/client/get-action-name.generated";

export const ActionsHeader = memo(function ActionsHeader(props: {
  actionId?: string;
  teamId?: string;
  appId?: string;
}) {
  const { data, loading } = useGetActionNameQuery({
    variables: { action_id: props.actionId ?? "" },
    context: { headers: { team_id: props.teamId ?? "" } },
  });

  const redirect = urls.actions({
    team_id: props.teamId ?? "",
    app_id: props.appId,
  });

  const trackDocsClicked = useCallback(() => {
    posthog.capture("docs_clicked", {
      teamId: props.teamId,
      appId: props.appId,
      actionId: props.actionId,
      location: "actions",
    });
  }, [props.actionId, props.appId, props.teamId]);

  const name = data?.action[0]?.name ?? "";
  return (
    <div className="w-full">
      <div>
        <Link href={redirect} className="flex flex-row items-center gap-x-2">
          <CaretIcon className="size-3 rotate-90 text-grey-400" />
          <Typography variant={TYPOGRAPHY.R5} className="text-grey-700">
            Back to Incognito Actions
          </Typography>
        </Link>
      </div>
      <div className="flex w-full items-center justify-between">
        <Typography
          variant={TYPOGRAPHY.H6}
          className="capitalize text-grey-900"
        >
          {loading ? <Skeleton width={200} /> : name}
        </Typography>

        <DecoratedButton
          variant="secondary"
          href="https://docs.worldcoin.org/id/incognito-actions"
          className="px-7 py-3 text-grey-700 "
          onClick={trackDocsClicked}
        >
          <DocsIcon />
          <Typography variant={TYPOGRAPHY.R3}>Learn more</Typography>
        </DecoratedButton>
      </div>
    </div>
  );
});
