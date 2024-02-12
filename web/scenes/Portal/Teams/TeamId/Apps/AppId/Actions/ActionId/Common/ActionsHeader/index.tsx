"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Link from "next/link";
import { memo, useCallback } from "react";
import { useGetActionNameQuery } from "./graphql/client/get-action-name.generated";
import Skeleton from "react-loading-skeleton";
import { urls } from "@/lib/urls";
import posthog from "posthog-js";

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
          <CaretIcon className="h-3 w-3 text-grey-400 rotate-90" />
          <Typography variant={TYPOGRAPHY.R5} className="text-grey-700">
            Back to Incognito Actions
          </Typography>
        </Link>
      </div>
      <div className="w-full flex justify-between items-center">
        <Typography
          variant={TYPOGRAPHY.H6}
          className="text-grey-900 capitalize"
        >
          {loading ? <Skeleton width={200} /> : name}
        </Typography>

        <DecoratedButton
          variant="secondary"
          href="https://docs.worldcoin.org/id/incognito-actions"
          className="text-grey-700 py-3 px-7 "
          onClick={trackDocsClicked}
        >
          <DocsIcon />
          <Typography variant={TYPOGRAPHY.R3}>Learn more</Typography>
        </DecoratedButton>
      </div>
    </div>
  );
});
