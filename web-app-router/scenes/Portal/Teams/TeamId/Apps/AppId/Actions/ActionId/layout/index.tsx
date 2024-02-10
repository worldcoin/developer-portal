import { ReactNode } from "react";
import { Tabs, Tab } from "@/components/Tabs";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { Auth0SessionUser } from "@/lib/types";

type Params = {
  teamId?: string;
  appId?: string;
  actionId?: string;
};

type ActionIdLayout = {
  params: Params;
  children: ReactNode;
};

export const ActionIdLayout = async (props: ActionIdLayout) => {
  const params = props.params;
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  const isEnoughPermissions = checkUserPermissions(user, params.teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  // TODO: Remove tabs for on chain apps
  return (
    <div className="h-full w-full">
      <div className="bg-grey-50 border-b border-grey-100">
        <SizingWrapper variant="nav">
          <Tabs className="m-auto font-gta">
            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}`}
              segment={null}
            >
              <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/settings`}
              segment={"settings"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Settings</Typography>
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/proof-debugging`}
              segment={"proof-debugging"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Proof debugging</Typography>
            </Tab>
            {isEnoughPermissions && (
              <Tab
                className="py-4"
                href={`/teams/${params!.teamId}/apps/${params!.appId}/actions/${params!.actionId}/danger`}
                segment={"danger"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
              </Tab>
            )}
          </Tabs>
        </SizingWrapper>
      </div>

      <SizingWrapper className="h-full">{props.children}</SizingWrapper>
    </div>
  );
};
