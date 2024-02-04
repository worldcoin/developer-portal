import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Status, StatusVariant } from "./Status";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Environment } from "./Environment";
import { FetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { useAtom } from "jotai";
import { viewModeAtom } from "../../layout";

type AppTopBarProps = {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
};

export const AppTopBar = (props: AppTopBarProps) => {
  const { appId, teamId, app } = props;
  const [viewMode, setviewMode] = useAtom(viewModeAtom);

  const appMetaData =
    viewMode === "verified"
      ? app.verified_app_metadata[0]
      : app.app_metadata[0];

  return (
    <div className="grid grid-cols-auto/1fr/auto gap-x-8 items-center">
      {/* Placeholder */}
      <div className="bg-grey-200 rounded-lg px-5 py-5 h-20 w-20 items-center flex justify-center">
        IMAGE
      </div>
      <div className="grid grid-cols-1 gap-y-1">
        <div className="flex flex-row gap-x-3 items-center">
          <Typography variant={TYPOGRAPHY.H6}>{appMetaData.name}</Typography>
          <Status status={appMetaData.verification_status as StatusVariant} />
        </div>
        <Environment
          environment={app.is_staging ? "staging" : "production"}
          engine={app.engine}
        />
      </div>
      <DecoratedButton type="submit" className="px-6 py-3 h-12">
        <Typography variant={TYPOGRAPHY.M3}>Submit for review</Typography>
      </DecoratedButton>
    </div>
  );
};
