import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSdk } from "./graphql/getTeamByUserId.generated";

export const getFirstTeamIdByUserId = async (
  user_id: string
): Promise<string | null> => {
  const client = await getAPIServiceGraphqlClient();
  const teams = await getSdk(client).GetTeamByUserId({ user_id });

  if (!teams || teams.team.length === 0) {
    return null;
  }

  return teams.team[0].id;
};
