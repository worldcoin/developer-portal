"use client";

import { LinkIcon } from "@/components/Icons/LinkIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AppLogo } from "./AppLogo";
import { useMemo } from "react";
import { StartUpIcon } from "@/components/Icons/StartUp";
import { SmartPhoneIcon } from "@/components/Icons/SmartPhoneIcon";
import clsx from "clsx";
import { CloudIcon } from "@/components/Icons/CloudIcon";
import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { Button } from "@/components/Button";
import { urls } from "@/lib/urls";
import { useParams } from "next/navigation";

export const App = (props: {
  id: string;
  imageSrc: string | undefined | null;
  name: string;
  isStaging: boolean;
  engine: "cloud" | "on-chain";
  status: StatusVariant;
}) => {
  const { teamId } = useParams() as { teamId: string };

  const environment = useMemo(
    () => (props.isStaging ? "staging" : "production"),
    [props.isStaging],
  );

  return (
    <Button
      href={urls.app({ team_id: teamId, app_id: props.id })}
      className="border border-grey-200 hover:border-blue-500 transition-colors rounded-20 pt-10 px-8 pb-6 grid gap-y-4 justify-items-center relative"
    >
      <AppStatus
        status={props.status}
        className="absolute top-4 right-4 px-2 py-1"
        typography={TYPOGRAPHY.R5}
      />

      <AppLogo src={props.imageSrc} name={props.name} />

      <div className="grid gap-y-1">
        <Typography variant={TYPOGRAPHY.M3} className="text-center">
          {props.name}
        </Typography>

        <div className="flex gap-x-4">
          <div className="flex flex-row gap-x-2 text-grey-400">
            {environment === "production" && (
              <StartUpIcon className="w-4 h-auto" />
            )}

            {environment === "staging" && (
              <SmartPhoneIcon className="w-4 h-auto" />
            )}

            <Typography variant={TYPOGRAPHY.R4} className={clsx("capitalize")}>
              {environment}
            </Typography>
          </div>

          <div className="w-px h-4 bg-grey-200" />

          <div className="flex flex-row gap-x-2 text-grey-400">
            {props.engine === "cloud" && <CloudIcon className="w-4 h-auto" />}
            {props.engine === "on-chain" && <LinkIcon className="w-4 h-auto" />}
            <Typography variant={TYPOGRAPHY.R4} className="capitalize">
              {props.engine}
            </Typography>
          </div>
        </div>
      </div>
    </Button>
  );
};
