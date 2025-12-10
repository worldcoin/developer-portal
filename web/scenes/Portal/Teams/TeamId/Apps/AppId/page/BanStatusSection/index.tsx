"use client";
import { useGetIsAppBannedQuery } from "../graphql/client/get-is-app-banned.generated";
import { BanStatus } from "./ban-status";

export const BanStatusSection = ({ appId }: { appId: string }) => {
  const { data } = useGetIsAppBannedQuery({
    variables: {
      app_id: appId,
    },
  });

  // NOTE: it's possible app array is empty
  const isAppBanned = !!data?.app[0]?.id;

  return isAppBanned && <BanStatus />;
};
