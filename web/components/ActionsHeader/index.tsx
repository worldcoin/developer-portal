"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DOCS_CLOUD_URL } from "@/lib/constants";
import clsx from "clsx";
import Link from "next/link";
import posthog from "posthog-js";
import { memo, useCallback } from "react";
import Skeleton from "react-loading-skeleton";

type ActionsHeaderProps = {
  displayText: string;
  backText: string;
  backUrl: string;
  learnMoreUrl?: string;
  isLoading?: boolean;
  className?: string;
  environment?: "staging" | "production";
  isDeprecated?: boolean;
  // Analytics context (optional)
  analyticsContext?: {
    teamId?: string;
    appId?: string;
    actionId?: string;
    location: string;
  };
};

export const ActionsHeader = memo(function ActionsHeader(
  props: ActionsHeaderProps,
) {
  const {
    displayText,
    backText,
    backUrl,
    learnMoreUrl = DOCS_CLOUD_URL,
    isLoading = false,
    className,
    environment,
    isDeprecated,
    analyticsContext,
  } = props;

  const trackDocsClicked = useCallback(() => {
    if (analyticsContext) {
      posthog.capture("docs_clicked", {
        teamId: analyticsContext.teamId,
        appId: analyticsContext.appId,
        actionId: analyticsContext.actionId,
        location: analyticsContext.location,
      });
    }
  }, [analyticsContext]);

  return (
    <div className={className}>
      <div className="grid w-full gap-y-5 md:gap-y-2">
        <div>
          <Link href={backUrl} className="flex flex-row items-center gap-x-2">
            <CaretIcon className="size-3 rotate-90 text-grey-400" />
            <Typography variant={TYPOGRAPHY.R5} className="text-grey-700">
              {backText}
            </Typography>
          </Link>
        </div>

        <div className="grid w-full grid-cols-1fr/auto items-center justify-between gap-x-3">
          <div className="flex items-center gap-x-2">
            <Typography
              variant={TYPOGRAPHY.H6}
              className="max-w-[400px] truncate text-grey-900 md:max-w-[750px]"
            >
              {isLoading ? <Skeleton width={200} /> : displayText}
            </Typography>

            {/* Environment Badge */}
            {!isLoading && environment && (
              <div
                className="inline-flex items-center gap-x-1.5 rounded-full bg-grey-50 px-2.5 py-1"
                title={environment === "staging" ? "Staging" : "Production"}
              >
                <div
                  className={clsx(
                    "size-1.5 rounded-full",
                    environment === "staging"
                      ? "bg-yellow-500"
                      : "bg-green-500",
                  )}
                />
                <Typography
                  variant={TYPOGRAPHY.R5}
                  className="capitalize text-grey-700"
                >
                  {environment}
                </Typography>
              </div>
            )}

            {/* Deprecated Badge */}
            {!isLoading && isDeprecated && (
              <div
                className="inline-flex items-center gap-x-1.5 rounded-full bg-grey-100 px-2.5 py-1"
                title="This action is deprecated and read-only"
              >
                <Typography variant={TYPOGRAPHY.R5} className="text-grey-500">
                  Deprecated
                </Typography>
              </div>
            )}
          </div>

          <DecoratedButton
            variant="secondary"
            href={learnMoreUrl}
            className="py-3 text-grey-700 md:px-7"
            onClick={trackDocsClicked}
          >
            <DocsIcon />

            <Typography variant={TYPOGRAPHY.R3} className="hidden md:block">
              Learn more
            </Typography>
          </DecoratedButton>
        </div>
      </div>
    </div>
  );
});
