"use server";

import { Graphs } from "./graphs";

export const GraphsSection = async ({ appId }: { appId: string }) => {
  // const session = await getSession();
  // const user = session?.user as Auth0SessionUser["user"];

  // if (!user) {
  //   return redirect(urls.logout());
  // }

  // const client = await getAPIServiceGraphqlClient();

  // const transactions = await getTransactionData(appId);
  // const verifications = await fetchAppStatsSdk(client).FetchAppStats({
  //   appId,
  //   startsAt: new Date(0).toISOString(),
  //   timeSpan: "day",
  // });

  // const data = {
  //   transactions,
  //   verifications: verifications.app_stats.map((v) => v.verifications),
  //   uniqueUsers: verifications.app_stats.map((v) => v.unique_users),
  // };

  const data = {
    transactions: [],
    verifications: [],
    uniqueUsers: [],
  };

  return <Graphs data={data} />;
};
