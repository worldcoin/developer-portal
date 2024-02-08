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
    <div className="flex flex-row gap-x-4 items-center ">
      <div className="py-1 rounded-3xl">
        <div className="flex flex-row gap-x-2">
          {environment === "production" && (
            <StartUpIcon className="w-4 h-auto text-system-success-300 " />
          )}
          {environment === "staging" && (
            <SmartPhoneIcon className="w-4 h-auto text-system-warning-300" />
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
      <div className="w-px h-4 bg-grey-200"></div>
      <div className="flex flex-row gap-x-2 text-blue-500">
        {engine === "cloud" && <CloudIcon className="w-4 h-auto" />}
        {engine === "on-chain" && <LinkIcon className="w-4 h-auto" />}
        <Typography variant={TYPOGRAPHY.R4} className="capitalize">
          {engine}
        </Typography>
      </div>
    </div>
  );
};
