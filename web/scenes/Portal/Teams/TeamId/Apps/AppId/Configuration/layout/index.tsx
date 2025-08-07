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
    <div className="flex flex-col items-start">
      <div className="order-2 md:order-1 md:w-full md:border-b md:border-grey-100 md:bg-grey-50">
        <SizingWrapper variant="nav">
          <Tabs className="px-6 py-4 font-gta md:py-0">
            <Tab
              className="md:py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/configuration`}
              segment={null}
            >
              <Typography variant={TYPOGRAPHY.R4}>Basic</Typography>
            </Tab>

            <Tab
              className="md:py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/configuration/app-store-refactored`}
              segment={"app-store-refactored"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Mini App Store</Typography>
            </Tab>

            <Tab
              className="md:py-4"
              href={`/teams/${params!.teamId}/apps/${params!.appId}/configuration/advanced`}
              segment={"advanced"}
            >
              <Typography variant={TYPOGRAPHY.R4}>Advanced</Typography>
            </Tab>

            {isEnoughPermissions && (
              <Tab
                className="md:py-4"
                href={`/teams/${params!.teamId}/apps/${params!.appId}/configuration/danger`}
                segment={"danger"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Danger zone</Typography>
              </Tab>
            )}
          </Tabs>
        </SizingWrapper>
      </div>

      <ImagesProvider teamId={params?.teamId} appId={params?.appId}>
        {props.children}
      </ImagesProvider>
    </div>
  );
};
