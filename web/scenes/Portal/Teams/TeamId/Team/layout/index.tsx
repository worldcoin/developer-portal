import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type TeamIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

export const TeamIdLayout = async (props: TeamIdLayoutProps) => {
  const params = props.params;
  const session = await getSession();

  const user = session?.user as Auth0SessionUser["user"];
  const ownerPermission = checkUserPermissions(user, params.teamId ?? "", [
    Role_Enum.Owner,
  ]);

  const ownerAndAdminPermission = checkUserPermissions(
    user,
    params.teamId ?? "",
    [Role_Enum.Owner, Role_Enum.Admin],
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
              <Typography variant={TYPOGRAPHY.R4}>
                <span className="max-md:hidden">Overview</span>
                <span className="md:hidden">Members</span>
              </Typography>
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

            {ownerPermission && (
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
