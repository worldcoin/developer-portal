import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Status } from "./Status";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Environment } from "./Environment";

type AppTopBarProps = {
  appId: string;
  teamId: string;
};
export const AppTopBar = (props: AppTopBarProps) => {
  const { appId, teamId } = props;

  return (
    <div className="grid grid-cols-auto/1fr/auto gap-x-8 items-center">
      {/* Placeholder */}
      <div className="bg-grey-200 rounded-lg px-5 py-5 h-20 w-20 items-center flex justify-center">
        IMAGE
      </div>
      <div className="grid grid-cols-1 gap-y-1">
        <div className="flex flex-row gap-x-3 items-center">
          <Typography variant={TYPOGRAPHY.H6}>A11 Test App</Typography>
          <Status status="Not verified" variant="rejected" />
        </div>
        <Environment environment="production" engine="cloud" />
      </div>
      <DecoratedButton type="submit" className="px-6 py-3 h-12">
        <Typography variant={TYPOGRAPHY.M3}>Submit for review</Typography>
      </DecoratedButton>
    </div>
  );
};
