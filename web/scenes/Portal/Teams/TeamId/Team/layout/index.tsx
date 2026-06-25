import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { userCanPerformAction } from "@/lib/team-permissions";
import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamLayoutProps = {
  params: Promise<Params>;
  children: ReactNode;
};

export const TeamLayout = async (props: TeamLayoutProps) => {
  const params = await props.params;
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const ownerPermission = userCanPerformAction(
    user,
    params.teamId ?? "",
    "edit_team_settings",
  );

  const ownerAndAdminPermission = userCanPerformAction(
    user,
    params.teamId ?? "",
    "view_api_keys",
  );

  const deleteTeamPermission = userCanPerformAction(
    user,
    params.teamId ?? "",
    "delete_team",
  );

  return (
    <div className="flex flex-col">
      <div className="order-2 md:order-1 md:w-full md:border-b md:border-grey-100">
        <SizingWrapper variant="nav">
          <Tabs className="px-6 py-4 font-gta md:py-0">
            <Tab
              className="md:py-4"
              href={`/teams/${params!.teamId}`}
              segment={null}
              underlined
            >
              <Typography variant={TYPOGRAPHY.R4}>Members</Typography>
            </Tab>

            <Tab
              className="md:hidden"
              href={`/teams/${params!.teamId}/app`}
              segment={"app"}
              underlined
            >
              <Typography variant={TYPOGRAPHY.R4}>Apps</Typography>
            </Tab>

            {ownerPermission && (
              <Tab
                className="md:py-4"
                href={`/teams/${params!.teamId}/settings`}
                segment={"settings"}
                underlined
              >
                <Typography variant={TYPOGRAPHY.R4}>Team settings</Typography>
              </Tab>
            )}

            {ownerAndAdminPermission && (
              <Tab
                className="md:py-4"
                href={`/teams/${params!.teamId}/api-keys`}
                segment={"api-keys"}
                underlined
              >
                <Typography variant={TYPOGRAPHY.R4}>API keys</Typography>
              </Tab>
            )}

            {deleteTeamPermission && (
              <Tab
                className="md:py-4"
                href={`/teams/${params!.teamId}/danger`}
                segment={"danger"}
                underlined
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
