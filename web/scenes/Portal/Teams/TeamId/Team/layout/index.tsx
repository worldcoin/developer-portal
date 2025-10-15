import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { ReactNode } from "react";
import { TabsWrapper } from "./TabsWrapper";
import {SizingWrapper} from "@/components/SizingWrapper";

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
          <TabsWrapper
              teamId={params.teamId!}
              hasOwnerPermission={ownerPermission}
              hasOwnerAndAdminPermission={ownerAndAdminPermission}
          />
        </SizingWrapper>
      </div>

      {props.children}
    </div>
  );
};
