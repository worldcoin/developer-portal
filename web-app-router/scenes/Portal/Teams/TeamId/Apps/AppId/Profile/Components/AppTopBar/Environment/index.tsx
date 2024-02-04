import { CloudIcon } from "@/components/Icons/CloudIcon";
import { LinkIcon } from "@/components/Icons/LinkIcon";
import { SmartPhoneIcon } from "@/components/Icons/SmartPhoneIcon";
import { StartUpIcon } from "@/components/Icons/StartUp";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type EnvironmentProps = {
  environment: string;
  engine: string;
};

const environmentStyles = {
  production: {
    normal: "bg-grey-100 text-system-success-700",
  },
  staging: {
    normal: "bg-system-warning-100 text-system-warning-700",
  },
};

export const Environment = (props: EnvironmentProps) => {
  const { environment, engine } = props;
  return (
    <div className="flex flex-row gap-x-4 items-center ">
      <div className="text-system-success-500 py-1 rounded-3xl">
        <div className="flex flex-row gap-x-2">
          {environment === "production" && (
            <StartUpIcon className="w-4 h-auto" />
          )}
          {environment === "staging" && (
            <SmartPhoneIcon className="w-4 h-auto" />
          )}

          <Typography variant={TYPOGRAPHY.R4} className="capitalize">
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
