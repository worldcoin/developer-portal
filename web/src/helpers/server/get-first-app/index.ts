import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSdk } from "./graphql/getAppByTeamId.generated";

export const getFirstApp = async (params: {
  user_id: string;
  team_id: string;
}): Promise<string | null> => {
  const { team_id } = params;
  const client = await getAPIServiceGraphqlClient();
  const apps = await getSdk(client).GetAppByTeamId({ team_id });

  if (!apps || apps.app.length === 0) {
    return null;
  }

  return apps.app[0].id;
};
