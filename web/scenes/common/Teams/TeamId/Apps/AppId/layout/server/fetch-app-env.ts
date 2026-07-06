import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  FetchAppEnvQuery,
  getSdk,
} from "../graphql/server/fetch-app-env.generated";
import { cache } from "react";

export const fetchAppEnvCached = cache(
  async (appId: string): Promise<FetchAppEnvQuery> => {
    const client = await getAPIServiceGraphqlClient();
    return getSdk(client).FetchAppEnv({ id: appId });
  },
);
