import { SizingWrapper } from "@/components/SizingWrapper";
import { Role_Enum } from "@/graphql/graphql";
import { urls } from "@/lib/urls";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";
import { SectionSubTabs } from "../../common/SectionSubTabs";
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
          <SectionSubTabs
            items={[
              {
                label: "Overview",
                href: urls.configuration({
                  team_id: params!.teamId!,
                  app_id: params!.appId!,
                }),
                segment: null,
              },
              {
                label: "Danger zone",
                href: `${urls.configuration({
                  team_id: params!.teamId!,
                  app_id: params!.appId!,
                })}/danger`,
                segment: "danger",
                hidden: !isEnoughPermissions,
              },
            ]}
          />
        </SizingWrapper>
      </div>

      <ImagesProvider teamId={params?.teamId} appId={params?.appId}>
        {props.children}
      </ImagesProvider>
    </div>
  );
};
