import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";
import { ImagesProvider } from "./ImagesProvider";

type Params = {
  teamId?: string;
  appId?: string;
  actionId?: string;
};

type AppProfileLayout = {
  params: Params;
  children: ReactNode;
};

export const AppProfileLayout = async (props: AppProfileLayout) => {
  const params = props.params;
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  const isEnoughPermissions = checkUserPermissions(user, params.teamId ?? "", [
    Role_Enum.Owner,
  ]);

  return (
    <div>
      <div className="border-b border-grey-100 bg-grey-50">
        <SizingWrapper variant="nav">
          <Tabs className="m-auto font-gta">
            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile`}
              segment={null}
            >
              <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/store-info`}
              segment={"store-info"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Store info</Typography>
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/gallery`}
              segment={"gallery"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Gallery</Typography>
            </Tab>

            <Tab
              className="py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/links`}
              segment={"links"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Links</Typography>
            </Tab>

            {isEnoughPermissions && (
              <Tab
                className="py-4"
                href={`/teams/${params!.teamId}/apps/${params!.appId}/profile/danger`}
                segment={"danger"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
              </Tab>
            )}
          </Tabs>
        </SizingWrapper>
      </div>
      <SizingWrapper>
        <ImagesProvider teamId={params?.teamId} appId={params?.appId}>
          {props.children}
        </ImagesProvider>
      </SizingWrapper>
    </div>
  );
};

