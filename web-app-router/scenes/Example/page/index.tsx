import { getAPIServiceGraphqlClient } from "@/lib/server-graphql-client";
import { getSdk as GetTeamsSdk } from "../graphql/server/teams.generated";
import { ClientComponent } from "../ClientComponent";

export const Page = async () => {
  const client = await getAPIServiceGraphqlClient();
  const data = await GetTeamsSdk(client).Teams();
  console.log(data);

  return (
    <div>
      <ClientComponent />
    </div>
  );
};
