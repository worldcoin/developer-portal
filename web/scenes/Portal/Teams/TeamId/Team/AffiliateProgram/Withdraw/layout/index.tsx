import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

type Params = {
  teamId?: string;
};

type Props = {
  params: Params;
  children: ReactNode;
};

export const WithdrawLayout = async (props: Props) => {
  const params = props.params;
  const teamId = params?.teamId;
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  const ownerAndAdminPermission = checkUserPermissions(
    user,
    params.teamId ?? "",
    [Role_Enum.Owner, Role_Enum.Admin],
  );

  if (!ownerAndAdminPermission) {
    return redirect(urls.affiliateProgram({ team_id: teamId }));
  }

  return props.children;
};
