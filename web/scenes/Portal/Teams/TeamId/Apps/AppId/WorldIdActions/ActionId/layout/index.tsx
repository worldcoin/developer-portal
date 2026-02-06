import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { urls } from "@/lib/urls";
import { getSession } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
  appId?: string;
  actionId?: string;
};

type WorldIdActionIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

export const WorldIdActionIdLayout = async (
  props: WorldIdActionIdLayoutProps,
) => {
  const params = props.params;
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  const isEnoughPermissions = checkUserPermissions(user, params.teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);

  return (
    <div className="flex flex-col items-start">
      <div className="order-2 w-full md:order-1 md:border-b md:border-grey-100 md:bg-grey-50">
        <SizingWrapper variant="nav">
          <Tabs className="px-6 py-4 font-gta md:py-0">
            <Tab
              className="md:py-4"
              href={urls.worldIdAction({
                team_id: params.teamId ?? "",
                app_id: params.appId ?? "",
                action_id: params.actionId ?? "",
              })}
              segment={null}
            >
              <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
            </Tab>

            <Tab
              className="md:py-4"
              href={urls.worldIdActionSettings({
                team_id: params.teamId ?? "",
                app_id: params.appId ?? "",
                action_id: params.actionId ?? "",
              })}
              segment={"settings"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Settings</Typography>
            </Tab>

            {isEnoughPermissions && (
              <Tab
                className="md:py-4"
                href={urls.worldIdActionDanger({
                  team_id: params.teamId ?? "",
                  app_id: params.appId ?? "",
                  action_id: params.actionId ?? "",
                })}
                segment={"danger"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
              </Tab>
            )}
          </Tabs>
        </SizingWrapper>
      </div>

      {props.children}
    </div>
  );
};
