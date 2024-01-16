import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSdk } from "./graphql/getTeamsByUserId.generated";

export const getFirstTeamIdByUserId = async (
  user_id: string
): Promise<string | null> => {
  const client = await getAPIServiceGraphqlClient();
  const teams = await getSdk(client).GetTeamsByUserId({ user_id });

  if (!teams || teams.team.length === 0) {
    return null;
  }

  return teams.team[0].id;
};
