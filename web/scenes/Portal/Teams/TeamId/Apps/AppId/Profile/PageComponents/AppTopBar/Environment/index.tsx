import { CloudIcon } from "@/components/Icons/CloudIcon";
import { LinkIcon } from "@/components/Icons/LinkIcon";
import { SmartPhoneIcon } from "@/components/Icons/SmartPhoneIcon";
import { StartUpIcon } from "@/components/Icons/StartUp";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

type EnvironmentProps = {
  environment: string;
  engine: string;
};

export const Environment = (props: EnvironmentProps) => {
  const { environment, engine } = props;
  return (
    <div className="flex flex-row items-center gap-x-4 ">
      <div className="rounded-3xl py-1">
        <div className="flex flex-row gap-x-2">
          {environment === "production" && (
            <StartUpIcon className="h-auto w-4 text-system-success-300 " />
          )}
          {environment === "staging" && (
            <SmartPhoneIcon className="h-auto w-4 text-system-warning-500" />
          )}

          <Typography
            variant={TYPOGRAPHY.R4}
            className={clsx("capitalize", {
              "text-system-success-500": environment === "production",
              "text-system-warning-500": environment === "staging",
            })}
          >
            {environment}
          </Typography>
        </div>
      </div>
      <div className="h-4 w-px bg-grey-200"></div>
      <div className="flex flex-row gap-x-2 text-blue-500">
        {engine === "cloud" && <CloudIcon className="h-auto w-4" />}
        {engine === "on-chain" && <LinkIcon className="h-auto w-4" />}
        <Typography variant={TYPOGRAPHY.R4} className="capitalize">
          {engine}
        </Typography>
      </div>
    </div>
  );
};
